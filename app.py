import os
from datetime import datetime, timedelta

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from dotenv import load_dotenv

from hubspot_client import HubSpotClient, get_demo_data

load_dotenv()

st.set_page_config(
    page_title="HubSpot BI ダッシュボード",
    page_icon="📊",
    layout="wide",
)

# ── Sidebar ──────────────────────────────────────────────────────────────────

with st.sidebar:
    st.title("📊 BI ダッシュボード")
    st.divider()

    access_token = os.getenv("HUBSPOT_ACCESS_TOKEN", "")
    if access_token:
        st.success("✅ HubSpot 接続済み")
    else:
        st.warning("⚠️ デモデータ表示中\n\n`.env` に `HUBSPOT_ACCESS_TOKEN` を設定すると実データが表示されます")

    st.divider()
    period = st.selectbox("表示期間", ["過去30日", "過去90日", "過去6ヶ月", "過去12ヶ月", "全期間"], index=2)

    if st.button("🔄 データ更新"):
        st.cache_data.clear()
        st.rerun()

    st.divider()
    st.caption("通貨: ¥ JPY")


# ── Data loading ──────────────────────────────────────────────────────────────

@st.cache_data(ttl=300)
def load_data(token: str) -> dict:
    if not token:
        return get_demo_data()
    try:
        client = HubSpotClient(token)
        return {
            "deals": client.get_deals(),
            "contacts": client.get_contacts(),
            "companies": client.get_companies(),
            "pipeline_stages": client.get_pipeline_stages(),
        }
    except Exception as exc:
        st.error(f"データ取得エラー: {exc}")
        return get_demo_data()


def _cutoff(label: str) -> datetime | None:
    days = {"過去30日": 30, "過去90日": 90, "過去6ヶ月": 180, "過去12ヶ月": 365}.get(label)
    return datetime.now() - timedelta(days=days) if days else None


def _filter(df: pd.DataFrame, col: str, since: datetime | None) -> pd.DataFrame:
    if since is None or df.empty or col not in df.columns:
        return df
    df = df.copy()
    df[col] = pd.to_datetime(df[col], errors="coerce")
    return df[df[col] >= since]


def _fmt_jpy(v) -> str:
    return "¥0" if (v is None or pd.isna(v)) else f"¥{int(v):,}"


data = load_data(access_token)
deals_all: pd.DataFrame = data["deals"]
contacts_all: pd.DataFrame = data["contacts"]
companies: pd.DataFrame = data["companies"]
stage_labels: dict[str, str] = data.get("pipeline_stages", {})

cutoff = _cutoff(period)
deals = _filter(deals_all, "createdate", cutoff)
contacts = _filter(contacts_all, "createdate", cutoff)


# ── KPI cards ────────────────────────────────────────────────────────────────

st.title("📊 HubSpot CRM BI ダッシュボード")
st.caption(f"{period}  •  更新: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
st.divider()

total_pipeline = deals["amount"].sum() if "amount" in deals.columns else 0.0

if "dealstage" in deals.columns and not deals.empty:
    won_mask = deals["dealstage"] == "closedwon"
else:
    won_mask = pd.Series(False, index=deals.index)

closed_won = deals.loc[won_mask, "amount"].sum() if "amount" in deals.columns else 0.0
total_deals = len(deals)
total_contacts = len(contacts)
win_rate = (won_mask.sum() / total_deals * 100) if total_deals > 0 else 0.0

c1, c2, c3, c4, c5 = st.columns(5)
c1.metric("💰 パイプライン総額", _fmt_jpy(total_pipeline))
c2.metric("🏆 成約額", _fmt_jpy(closed_won))
c3.metric("📋 案件数", f"{total_deals:,}")
c4.metric("👥 コンタクト数", f"{total_contacts:,}")
c5.metric("🎯 成約率", f"{win_rate:.1f}%")

st.divider()


# ── Tabs ──────────────────────────────────────────────────────────────────────

tab1, tab2, tab3 = st.tabs(["📈 案件パイプライン", "👥 コンタクト", "🏢 会社"])


# ── Tab 1: Deal pipeline ──────────────────────────────────────────────────────

with tab1:
    if deals.empty:
        st.info("選択期間内に案件データがありません")
    else:
        col1, col2 = st.columns(2)

        stage_grp = (
            deals.groupby("dealstage", dropna=False)
            .agg(count=("dealname", "count"), value=("amount", "sum"))
            .reset_index()
        )
        stage_grp["label"] = stage_grp["dealstage"].map(lambda x: stage_labels.get(x, x) if x else "不明")

        with col1:
            fig_funnel = go.Figure(go.Funnel(
                y=stage_grp["label"],
                x=stage_grp["count"],
                textinfo="value+percent initial",
            ))
            fig_funnel.update_layout(title="ステージ別案件数", height=360, margin=dict(t=40, l=0, r=0, b=0))
            st.plotly_chart(fig_funnel, use_container_width=True)

        with col2:
            fig_bar = px.bar(
                stage_grp, x="label", y="value",
                title="ステージ別パイプライン額 (¥)",
                color="value", color_continuous_scale="Blues",
                labels={"label": "ステージ", "value": "金額 (¥)"},
            )
            fig_bar.update_layout(height=360, showlegend=False, margin=dict(t=40, l=0, r=0, b=0))
            st.plotly_chart(fig_bar, use_container_width=True)

        deals_ts = deals.copy()
        deals_ts["createdate"] = pd.to_datetime(deals_ts["createdate"], errors="coerce")
        deals_ts = deals_ts.dropna(subset=["createdate"]).set_index("createdate").sort_index()

        if not deals_ts.empty:
            monthly = deals_ts.resample("ME").agg(count=("dealname", "count"), value=("amount", "sum")).reset_index()
            monthly["month"] = monthly["createdate"].dt.strftime("%Y-%m")

            fig_trend = go.Figure()
            fig_trend.add_trace(go.Bar(
                x=monthly["month"], y=monthly["count"], name="案件数",
                marker_color="rgba(99,110,250,0.7)",
            ))
            fig_trend.add_trace(go.Scatter(
                x=monthly["month"], y=monthly["value"], name="金額 (¥)",
                yaxis="y2", line=dict(color="#ff6b6b", width=2), mode="lines+markers",
            ))
            fig_trend.update_layout(
                title="月次案件推移",
                yaxis=dict(title="案件数"),
                yaxis2=dict(title="金額 (¥)", overlaying="y", side="right"),
                height=300, legend=dict(x=0.01, y=0.99),
                margin=dict(t=40, l=0, r=0, b=0),
            )
            st.plotly_chart(fig_trend, use_container_width=True)

        st.subheader("上位案件")
        show_cols = [c for c in ["dealname", "amount", "dealstage", "closedate"] if c in deals.columns]
        top = deals[show_cols].copy().sort_values("amount", ascending=False).head(10)
        if "amount" in top.columns:
            top["amount"] = top["amount"].apply(_fmt_jpy)
        if "dealstage" in top.columns and stage_labels:
            top["dealstage"] = top["dealstage"].map(lambda x: stage_labels.get(x, x))
        top.columns = [{"dealname": "案件名", "amount": "金額", "dealstage": "ステージ", "closedate": "クローズ日"}.get(c, c) for c in top.columns]
        st.dataframe(top, use_container_width=True, hide_index=True)


# ── Tab 2: Contacts ───────────────────────────────────────────────────────────

with tab2:
    if contacts.empty:
        st.info("選択期間内にコンタクトデータがありません")
    else:
        col1, col2 = st.columns([3, 2])

        with col1:
            cont_ts = contacts.copy()
            cont_ts["createdate"] = pd.to_datetime(cont_ts["createdate"], errors="coerce")
            cont_ts = cont_ts.dropna(subset=["createdate"]).set_index("createdate").sort_index()

            if not cont_ts.empty:
                monthly_c = cont_ts.resample("ME").size().reset_index(name="count")
                monthly_c["month"] = monthly_c["createdate"].dt.strftime("%Y-%m")
                monthly_c["cumulative"] = monthly_c["count"].cumsum()

                fig_c = go.Figure()
                fig_c.add_trace(go.Bar(
                    x=monthly_c["month"], y=monthly_c["count"], name="新規",
                    marker_color="rgba(99,110,250,0.7)",
                ))
                fig_c.add_trace(go.Scatter(
                    x=monthly_c["month"], y=monthly_c["cumulative"], name="累計",
                    yaxis="y2", line=dict(color="#ff6b6b", width=2), mode="lines+markers",
                ))
                fig_c.update_layout(
                    title="コンタクト増加推移",
                    yaxis=dict(title="新規コンタクト数"),
                    yaxis2=dict(title="累計", overlaying="y", side="right"),
                    height=360, margin=dict(t=40, l=0, r=0, b=0),
                )
                st.plotly_chart(fig_c, use_container_width=True)

        with col2:
            if "hs_lead_status" in contacts.columns:
                status_cnt = contacts["hs_lead_status"].dropna().value_counts().reset_index()
                status_cnt.columns = ["status", "count"]
                if not status_cnt.empty:
                    fig_pie = px.pie(
                        status_cnt, values="count", names="status",
                        title="リードステータス",
                        color_discrete_sequence=px.colors.qualitative.Set3,
                    )
                    fig_pie.update_layout(height=360, margin=dict(t=40, l=0, r=20, b=20))
                    st.plotly_chart(fig_pie, use_container_width=True)

        if "lifecyclestage" in contacts.columns:
            lc_cnt = contacts["lifecyclestage"].dropna().value_counts().reset_index()
            lc_cnt.columns = ["stage", "count"]
            if not lc_cnt.empty:
                fig_lc = px.bar(
                    lc_cnt, x="stage", y="count",
                    title="ライフサイクルステージ",
                    color="count", color_continuous_scale="Blues",
                    labels={"stage": "ステージ", "count": "人数"},
                )
                fig_lc.update_layout(height=280, showlegend=False, margin=dict(t=40, l=0, r=0, b=0))
                st.plotly_chart(fig_lc, use_container_width=True)


# ── Tab 3: Companies ──────────────────────────────────────────────────────────

with tab3:
    col1, col2 = st.columns([2, 1])

    with col1:
        if not companies.empty and "industry" in companies.columns:
            ind_cnt = companies["industry"].dropna().value_counts().head(10).reset_index()
            ind_cnt.columns = ["industry", "count"]
            if not ind_cnt.empty:
                fig_ind = px.bar(
                    ind_cnt, x="count", y="industry", orientation="h",
                    title="業種別会社数",
                    color="count", color_continuous_scale="Blues",
                    labels={"industry": "業種", "count": "社数"},
                )
                fig_ind.update_layout(height=380, showlegend=False, margin=dict(t=40, l=0, r=0, b=0))
                st.plotly_chart(fig_ind, use_container_width=True)
        else:
            st.info("会社データがありません")

    with col2:
        st.metric("総会社数", f"{len(companies):,}")
        if not companies.empty and "country" in companies.columns:
            country_cnt = companies["country"].dropna().value_counts().head(5).reset_index()
            country_cnt.columns = ["国", "社数"]
            if not country_cnt.empty:
                st.subheader("国別分布")
                st.dataframe(country_cnt, use_container_width=True, hide_index=True)

    if not companies.empty:
        st.subheader("会社一覧")
        show_cols = [c for c in ["name", "industry", "city", "country", "employees"] if c in companies.columns]
        display = companies[show_cols].copy().head(20)
        display.columns = [
            {"name": "会社名", "industry": "業種", "city": "都市", "country": "国", "employees": "従業員数"}.get(c, c)
            for c in display.columns
        ]
        st.dataframe(display, use_container_width=True, hide_index=True)
