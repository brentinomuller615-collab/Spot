import urllib.request
import json
import ssl
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

base_url = 'https://citymaps.stellenbosch.gov.za/server/rest/services'

def get_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req, context=ctx, timeout=10)
    return json.loads(response.read())

folders = ['AFLA_V2', 'Basemap', 'CommunityDevelopment', 'CommunityServices', 'CorporateGIS', 'Dashboards', 'EconomicDevelopment', 'Engineering', 'Finance', 'FireServices', 'Geocode', 'Geoprocessing', 'Hosted', 'InformalSettlements', 'LawEnforcement', 'LUM', 'NatureConservation', 'Planning', 'ProtectionServices', 'SharedServices', 'SolidWaste', 'TrafficServices', 'Utilities']

for folder in folders:
    print(f'Checking {folder}...', flush=True)
    try:
        data = get_json(f'{base_url}/{folder}?f=json')
        if 'error' in data:
            print(f'  Closed: {data["error"]["message"]}', flush=True)
        else:
            services = data.get('services', [])
            for service in services:
                name = service.get('name').lower()
                print(f"  Open Service: {service.get('name')} ({service.get('type')})", flush=True)
                if 'MapServer' in service.get('type') or 'FeatureServer' in service.get('type'):
                    try:
                        svc_data = get_json(f"{base_url}/{service.get('name')}/{service.get('type')}?f=json")
                        layers = svc_data.get('layers', [])
                        for layer in layers:
                            lname = layer.get('name', '').lower()
                            if 'park' in lname or 'bay' in lname or 'space' in lname or 'traffic' in lname:
                                print(f"    *** FOUND LAYER: {layer.get('id')} - {layer.get('name')}", flush=True)
                    except Exception as e:
                        print(f'    Error reading layers for {service.get("name")}', flush=True)
    except Exception as e:
        print(f'  Error: {e}', flush=True)
