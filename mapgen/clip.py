import json, math, sys
from shapely.geometry import shape, box, Polygon, MultiPolygon
def build(src, lon0, lon1, lat0, lat1, S, cdeg, tol, out):
    g=json.load(open(src))
    geom=shape(g['features'][0]['geometry'] if 'features' in g else g['geometry'])
    if not geom.is_valid: geom=geom.buffer(0)
    b=box(lon0,lat0,lon1,lat1)
    clipped=geom.intersection(b).simplify(tol,preserve_topology=True)
    c=math.cos(math.radians(cdeg))
    def P(lon,lat): return ((lon-lon0)*c*S,(lat1-lat)*S)
    def ring(r):
        pts=[P(x,y) for x,y in r.coords]
        s="M"+"L".join("%.1f,%.1f"%p for p in pts)+"Z"
        return s
    polys=[]
    geoms=[clipped] if isinstance(clipped,Polygon) else [x for x in getattr(clipped,'geoms',[]) if isinstance(x,Polygon)]
    d=""
    for p in geoms:
        d+=ring(p.exterior)
        for i in p.interiors: d+=ring(i)
    W=(lon1-lon0)*c*S; H=(lat1-lat0)*S
    open(out,'w').write(d)
    print(out,len(d),'W=%.1f H=%.1f'%(W,H))
    return d,W,H
d,W,H=build('land-10m.geojson',31,48,9,33,60,23,0.004,'reg-land.txt')
open('reg.svg','w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %.0f %.0f" width="470"><rect width="%.0f" height="%.0f" fill="#cde"/><path fill-rule="evenodd" fill="#e8d9b5" d="%s"/></svg>'%(W,H,W,H,d))
d,W,H=build('land-50m.geojson',25,60,9,39,20,27,0.02,'wide-land.txt')
open('wide2.svg','w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %.0f %.0f" width="620"><rect width="%.0f" height="%.0f" fill="#cde"/><path fill-rule="evenodd" fill="#e8d9b5" d="%s"/></svg>'%(W,H,W,H,d))
