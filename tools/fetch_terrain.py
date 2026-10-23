# Ambil data ketinggian (Terrain Tiles, format terrarium, AWS Open Data: elevation-tiles-prod) lalu
# resample ke grid lon/lat biasa untuk peta 3D. Hasil: build/terrain/<nama>.png (R=tinggi byte atas, G=byte bawah,
# nilai = meter + 1000, laut dibatasi -1000 m) dan build/terrain/meta.json.
# Pakai: python3 tools/fetch_terrain.py [CACHE_DIR]. Butuh numpy + Pillow + akses internet. Hanya perlu diulang bila area berubah.
import sys,os,math,io,json,urllib.request
import numpy as np
from PIL import Image
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
CACHE=sys.argv[1] if len(sys.argv)>1 else '/tmp/terrain-cache'
OUT=os.path.join(ROOT,'build','terrain');os.makedirs(OUT,exist_ok=True);os.makedirs(CACHE,exist_ok=True)
URL='https://s3.amazonaws.com/elevation-tiles-prod/terrarium/%d/%d/%d.png'
# nama: (lonB, lonT, latS, latU, zoom tile, kolom grid)
AREAS={
 'region':(34.2,44.8,19.4,31.9,7,240),
 'makkah':(39.64,40.12,21.27,21.56,13,340),
 'madinah':(39.42,39.80,24.32,24.62,13,300),
}
def tile(z,x,y):
    f='%s/%d-%d-%d.png'%(CACHE,z,x,y)
    if not os.path.exists(f):
        with urllib.request.urlopen(URL%(z,x,y),timeout=60) as r: open(f,'wb').write(r.read())
    a=np.asarray(Image.open(f).convert('RGB')).astype(np.float64)
    return a[:,:,0]*256+a[:,:,1]+a[:,:,2]/256-32768
def lon2x(lon,z): return (lon+180)/360*2**z
def lat2y(lat,z): r=math.radians(lat);return (1-math.log(math.tan(r)+1/math.cos(r))/math.pi)/2*2**z
meta={}
for name,(l0,l1,a0,a1,z,cols) in AREAS.items():
    kx=math.cos(math.radians((a0+a1)/2))
    rows=int(round(cols*(a1-a0)/((l1-l0)*kx)))
    x0,x1=int(lon2x(l0,z)),int(lon2x(l1,z));y0,y1=int(lat2y(a1,z)),int(lat2y(a0,z))
    big=np.zeros(((y1-y0+1)*256,(x1-x0+1)*256))
    for ty in range(y0,y1+1):
        for tx in range(x0,x1+1):
            big[(ty-y0)*256:(ty-y0+1)*256,(tx-x0)*256:(tx-x0+1)*256]=tile(z,tx,ty)
    lons=np.linspace(l0,l1,cols);lats=np.linspace(a1,a0,rows)
    px=(np.array([lon2x(v,z) for v in lons])-x0)*256-0.5
    py=(np.array([lat2y(v,z) for v in lats])-y0)*256-0.5
    # rata-rata area (bukan titik) supaya tidak berisik saat diperkecil
    sx=max(1,int((px[1]-px[0])/2));sy=max(1,int(abs(py[1]-py[0])/2))
    from numpy.lib.stride_tricks import sliding_window_view
    pad=np.pad(big,((sy,sy),(sx,sx)),mode='edge')
    box=sliding_window_view(pad,(2*sy+1,2*sx+1)).mean(axis=(2,3)) if (sx>1 or sy>1) else big
    gx,gy=np.meshgrid(np.clip(px,0,big.shape[1]-1),np.clip(py,0,big.shape[0]-1))
    ix=np.floor(gx).astype(int);iy=np.floor(gy).astype(int);fx=gx-ix;fy=gy-iy
    ix1=np.minimum(ix+1,big.shape[1]-1);iy1=np.minimum(iy+1,big.shape[0]-1)
    v=(box[iy,ix]*(1-fx)*(1-fy)+box[iy,ix1]*fx*(1-fy)+box[iy1,ix]*(1-fx)*fy+box[iy1,ix1]*fx*fy)
    e=np.clip(np.round(v)+1000,0,65535).astype(np.uint32)
    img=np.zeros((rows,cols,3),np.uint8);img[:,:,0]=e>>8;img[:,:,1]=e&255
    Image.fromarray(img).save(os.path.join(OUT,name+'.png'),optimize=True)
    meta[name]={'bx':[l0,l1,a0,a1],'w':cols,'h':rows,'min':float(v.min()),'max':float(v.max())}
    print(name,cols,'x',rows,'elev %.0f..%.0f'%(v.min(),v.max()),os.path.getsize(os.path.join(OUT,name+'.png')),'B')
json.dump(meta,open(os.path.join(OUT,'meta.json'),'w'),indent=1)
