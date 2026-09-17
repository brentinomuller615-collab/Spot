import urllib.request
import json
import os

url_data = "https://services7.arcgis.com/v8XBa2naYNQGOjlG/ArcGIS/rest/services/PS_AST_PARKINGBAYSEXPLODED_PV/FeatureServer/0/query?where=1=1&outFields=*&f=geojson&resultRecordCount=10&outSR=4326"
url_info = "https://services7.arcgis.com/v8XBa2naYNQGOjlG/ArcGIS/rest/services/PS_AST_PARKINGBAYSEXPLODED_PV/FeatureServer?f=json"
url_bbox = "https://services7.arcgis.com/v8XBa2naYNQGOjlG/ArcGIS/rest/services/PS_AST_PARKINGBAYSEXPLODED_PV/FeatureServer/0/query?geometry=18.850,-33.945,18.870,-33.930&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&returnCountOnly=true&f=json"

def fetch(url, filename):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        data = response.read()
        with open(filename, 'wb') as f:
            f.write(data)
        print(f"Saved {filename}")

fetch(url_data, "data3.json")
fetch(url_info, "info3.json")
fetch(url_bbox, "bbox3.json")
