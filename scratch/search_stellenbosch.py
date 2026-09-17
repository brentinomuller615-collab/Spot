import urllib.request
import json
import ssl
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

base_url = 'https://citymaps.stellenbosch.gov.za/server/rest/services'

def get_json(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req, context=ctx, timeout=10)
        return json.loads(response.read())
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return {}

data = get_json(base_url + '?f=json')
folders = data.get('folders', [])
print(f"Found folders: {folders}")

for folder in folders:
    print(f'\\nChecking folder: {folder}')
    folder_data = get_json(f'{base_url}/{folder}?f=json')
    services = folder_data.get('services', [])
    for service in services:
        print(f"  Service: {service.get('name')} ({service.get('type')})")
        if 'MapServer' in service.get('type') or 'FeatureServer' in service.get('type'):
            svc_data = get_json(f"{base_url}/{service.get('name')}/{service.get('type')}?f=json")
            layers = svc_data.get('layers', [])
            for layer in layers:
                name = layer.get('name', '').lower()
                if 'park' in name or 'bay' in name or 'space' in name:
                    print(f"    *** POTENTIAL MATCH: Layer {layer.get('id')} - {layer.get('name')}")
