# Unduh font Google (subset latin + latin-ext, woff2) ke fonts/ supaya app bisa jalan offline tanpa Google Fonts.
import re,urllib.request,os,sys
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..');OUT=os.path.join(ROOT,'fonts');os.makedirs(OUT,exist_ok=True)
CSS="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Marcellus&family=Public+Sans:wght@400;500;600&display=swap"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
def get(u):return urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":UA}),timeout=30).read()
css=get(CSS).decode()
blocks=re.findall(r'/\* ([\w-]+) \*/\s*(@font-face\s*\{.*?\})',css,flags=re.S)
out=[];n=0
for sub,b in blocks:
    if sub not in('latin','latin-ext'):continue
    fam=re.search(r"font-family:\s*'([^']+)'",b).group(1);w=re.search(r'font-weight:\s*(\d+)',b).group(1)
    url=re.search(r'url\((https://[^)]+)\)',b).group(1)
    fn="%s-%s-%s.woff2"%(fam.replace(' ','').lower(),w,sub)
    open(os.path.join(OUT,fn),'wb').write(get(url));n+=1
    out.append(b.replace(url,fn).replace("format('woff2')","format('woff2')"))
open(os.path.join(OUT,'fonts.css'),'w').write("\n".join(out)+"\n")
print(n,"file font")
