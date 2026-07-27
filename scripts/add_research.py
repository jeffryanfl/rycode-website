#!/usr/bin/env python3
"""
Rycode Research Ingestion Script
--------------------------------
This script allows adding new model benchmarks, supply chain companies, or research entries
to the website's JSON data stores cleanly without touching Astro frontend code.

Usage examples:
  python3 scripts/add_research.py --type model --name "Claude 3.7 Sonnet" --swe 85.2 --gdp 1850 --dev "Anthropic"
  python3 scripts/add_research.py --type supply_chain --tier 4 --name "Samsung Electronics" --ticker "005930.KS" --role "HBM4 memory provider"
"""

import argparse
import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'data')

def load_json(filepath):
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_json(filepath, data):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"[+] Successfully updated {filepath}")

def add_model(name, developer, swe_bench, gdp_val, arc_agi, architecture, context_window):
    models_file = os.path.join(DATA_DIR, 'models.json')
    data = load_json(models_file)
    model_id = name.lower().replace(' ', '-').replace('.', '-')
    
    new_entry = {
        "id": model_id,
        "name": name,
        "developer": developer,
        "releaseDate": "2026-07",
        "sweBench": float(swe_bench) if swe_bench else None,
        "gdpValElo": int(gdp_val) if gdp_val else None,
        "arcAgi3": float(arc_agi) if arc_agi else None,
        "architecture": architecture or "Transformer / MoE",
        "contextWindow": context_window or "1.0M tokens",
        "status": "Validated"
    }
    
    # Check if existing entry exists, update or append
    existing_idx = next((i for i, m in enumerate(data) if m['id'] == model_id), None)
    if existing_idx is not None:
        data[existing_idx] = new_entry
        print(f"[~] Updated existing model entry: {name}")
    else:
        data.append(new_entry)
        print(f"[+] Added new model entry: {name}")
        
    save_json(models_file, data)

def add_supply_chain(tier, name, ticker, role):
    sc_file = os.path.join(DATA_DIR, 'supply_chain.json')
    data = load_json(sc_file)
    tier_num = int(tier)
    
    target_tier = next((t for t in data if t['tier'] == tier_num), None)
    if not target_tier:
        print(f"[!] Tier {tier_num} not found in supply_chain.json")
        return
        
    company_entry = {"name": name, "ticker": ticker, "role": role}
    existing_co = next((i for i, c in enumerate(target_tier['companies']) if c['name'].lower() == name.lower()), None)
    if existing_co is not None:
        target_tier['companies'][existing_co] = company_entry
        print(f"[~] Updated company in Tier {tier_num}: {name}")
    else:
        target_tier['companies'].append(company_entry)
        print(f"[+] Added company to Tier {tier_num}: {name}")
        
    save_json(sc_file, data)

def main():
    parser = argparse.ArgumentParser(description="Ingest new research into Rycode Website data stores")
    parser.add_argument('--type', choices=['model', 'supply_chain'], required=True)
    parser.add_argument('--name', required=True, help="Entity name")
    parser.add_argument('--developer', default="Independent", help="Developer or provider")
    parser.add_argument('--swe', help="SWE-bench score")
    parser.add_argument('--gdp', help="GDPval-AA Elo score")
    parser.add_argument('--arc', help="ARC-AGI-3 score")
    parser.add_argument('--arch', help="Model architecture")
    parser.add_argument('--context', help="Context window size")
    parser.add_argument('--tier', help="Supply chain tier (1-8)")
    parser.add_argument('--ticker', help="Stock ticker symbol")
    parser.add_argument('--role', help="Company strategic role")
    
    args = parser.parse_args()
    
    if args.type == 'model':
        add_model(args.name, args.developer, args.swe, args.gdp, args.arc, args.arch, args.context)
    elif args.type == 'supply_chain':
        if not args.tier or not args.role:
            print("[!] Supply chain entries require --tier and --role")
            return
        add_supply_chain(args.tier, args.name, args.ticker or "N/A", args.role)

if __name__ == '__main__':
    main()
