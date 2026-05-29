import numpy as np
import pandas as pd
import random
import requests
from datetime import datetime, timedelta


class HubSpotClient:
    BASE_URL = "https://api.hubapi.com"

    def __init__(self, access_token: str):
        self.headers = {"Authorization": f"Bearer {access_token}"}

    def _get_all_pages(self, path: str, properties: list[str]) -> list[dict]:
        results = []
        after = None
        while True:
            params: dict = {"limit": 100, "properties": properties}
            if after:
                params["after"] = after
            resp = requests.get(f"{self.BASE_URL}{path}", headers=self.headers, params=params, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            results.extend(data.get("results", []))
            paging = data.get("paging")
            if not paging or not paging.get("next"):
                break
            after = paging["next"]["after"]
        return results

    def get_pipeline_stages(self) -> dict[str, str]:
        resp = requests.get(f"{self.BASE_URL}/crm/v3/pipelines/deals", headers=self.headers, timeout=30)
        resp.raise_for_status()
        stages: dict[str, str] = {}
        for pipeline in resp.json().get("results", []):
            for stage in pipeline.get("stages", []):
                stages[stage["id"]] = stage["label"]
        return stages

    def get_deals(self) -> pd.DataFrame:
        props = ["dealname", "amount_in_home_currency", "dealstage", "closedate", "createdate"]
        results = self._get_all_pages("/crm/v3/objects/deals", props)
        if not results:
            return pd.DataFrame(columns=["id", "dealname", "amount", "dealstage", "closedate", "createdate"])
        records = []
        for item in results:
            p = item.get("properties", {})
            raw_amount = p.get("amount_in_home_currency")
            records.append({
                "id": item["id"],
                "dealname": p.get("dealname"),
                "amount": float(raw_amount) if raw_amount else np.nan,
                "dealstage": p.get("dealstage"),
                "closedate": pd.to_datetime(p.get("closedate"), errors="coerce"),
                "createdate": pd.to_datetime(p.get("createdate"), errors="coerce"),
            })
        return pd.DataFrame(records)

    def get_contacts(self) -> pd.DataFrame:
        props = ["firstname", "lastname", "email", "createdate", "hs_lead_status", "lifecyclestage"]
        results = self._get_all_pages("/crm/v3/objects/contacts", props)
        if not results:
            return pd.DataFrame(columns=["id", "name", "email", "createdate", "hs_lead_status", "lifecyclestage"])
        records = []
        for item in results:
            p = item.get("properties", {})
            records.append({
                "id": item["id"],
                "name": f"{p.get('firstname', '')} {p.get('lastname', '')}".strip(),
                "email": p.get("email"),
                "createdate": pd.to_datetime(p.get("createdate"), errors="coerce"),
                "hs_lead_status": p.get("hs_lead_status"),
                "lifecyclestage": p.get("lifecyclestage"),
            })
        return pd.DataFrame(records)

    def get_companies(self) -> pd.DataFrame:
        props = ["name", "industry", "city", "country", "numberofemployees"]
        results = self._get_all_pages("/crm/v3/objects/companies", props)
        if not results:
            return pd.DataFrame(columns=["id", "name", "industry", "city", "country", "employees"])
        records = []
        for item in results:
            p = item.get("properties", {})
            records.append({
                "id": item["id"],
                "name": p.get("name"),
                "industry": p.get("industry"),
                "city": p.get("city"),
                "country": p.get("country"),
                "employees": p.get("numberofemployees"),
            })
        return pd.DataFrame(records)


def get_demo_data() -> dict:
    random.seed(42)
    np.random.seed(42)

    pipeline_stages = {
        "prospecting": "見込み客",
        "qualification": "ヒアリング",
        "proposal": "提案",
        "negotiation": "契約交渉",
        "closedwon": "成約",
        "closedlost": "失注",
    }
    stage_keys = list(pipeline_stages.keys())
    stage_weights = [0.25, 0.20, 0.20, 0.15, 0.12, 0.08]

    now = datetime.now()

    deal_records = []
    for i in range(45):
        stage = random.choices(stage_keys, weights=stage_weights)[0]
        days_ago = random.randint(0, 365)
        create_dt = now - timedelta(days=days_ago)
        close_dt = create_dt + timedelta(days=random.randint(14, 90)) if stage in ("closedwon", "closedlost") else None
        amount = round(random.uniform(200_000, 5_000_000) / 10_000) * 10_000 if stage != "closedlost" else np.nan
        deal_records.append({
            "id": str(i + 1),
            "dealname": f"案件 {i + 1:03d}",
            "amount": amount,
            "dealstage": stage,
            "closedate": close_dt,
            "createdate": create_dt,
        })

    deals_df = pd.DataFrame(deal_records)
    deals_df["createdate"] = pd.to_datetime(deals_df["createdate"])
    deals_df["closedate"] = pd.to_datetime(deals_df["closedate"])

    lead_statuses = ["NEW", "OPEN", "IN_PROGRESS", "OPEN_DEAL", "UNQUALIFIED", "CONNECTED"]
    lifecycle_stages = ["lead", "marketingqualifiedlead", "salesqualifiedlead", "opportunity", "customer"]
    contact_records = []
    for i in range(80):
        contact_records.append({
            "id": str(i + 1),
            "name": f"コンタクト {i + 1}",
            "email": f"contact{i + 1}@example.com",
            "createdate": now - timedelta(days=random.randint(0, 365)),
            "hs_lead_status": random.choice(lead_statuses),
            "lifecyclestage": random.choice(lifecycle_stages),
        })
    contacts_df = pd.DataFrame(contact_records)
    contacts_df["createdate"] = pd.to_datetime(contacts_df["createdate"])

    industries = ["TECHNOLOGY", "FINANCE", "MANUFACTURING", "RETAIL", "HEALTHCARE", "CONSULTING"]
    company_records = []
    for i in range(30):
        company_records.append({
            "id": str(i + 1),
            "name": f"株式会社サンプル {i + 1}",
            "industry": random.choice(industries),
            "city": random.choice(["東京", "大阪", "名古屋", "福岡", "札幌"]),
            "country": "Japan",
            "employees": random.choice(["1-10", "11-50", "51-200", "201-500", "501-1000"]),
        })
    companies_df = pd.DataFrame(company_records)

    return {
        "deals": deals_df,
        "contacts": contacts_df,
        "companies": companies_df,
        "pipeline_stages": pipeline_stages,
    }
