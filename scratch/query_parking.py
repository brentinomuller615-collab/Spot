import urllib.request
import json
import ssl
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://citymaps.stellenbosch.gov.za/server/rest/services/Basemap/BasemapData/MapServer/14/query?where=1=1&geometry=2099000,-4015000,2103000,-4011000&geometryType=esriGeometryEnvelope&inSR=3857&outFields=*&outSR=4326&f=json'

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
response = urllib.request.urlopen(req, context=ctx)
data = json.loads(response.read())

features = data.get('features', [])
print(f'Number of features: {len(features)}')
if len(features) > 0:
    print('First feature:', json.dumps(features[0], indent=2))
