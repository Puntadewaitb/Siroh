/* ---------- Simpul tempat perjalanan: stasiun -> tempat (dipakai peta 3D) ---------- */
var NODE_OF=["mk","mk","mk","mk","mk","mk","th","mk","mk","md","bd","uh","md","hd","kh","mu","hu","md","md"];
var NODES={
 mk:{n:"Makkah",full:"Makkah dan sekitarnya",ll:PL.mk,dx:0,dy:0},
 th:{n:"Thaif",full:"Thaif",ll:PL.th,dx:0,dy:0},
 md:{n:"Madinah",full:"Madinah",ll:PL.md,dx:0,dy:6},
 bd:{n:"Badr",full:"Badr",ll:PL.bd,dx:0,dy:0},
 uh:{n:"Uhud",full:"Uhud",ll:PL.uh,dx:11,dy:-13},
 hd:{n:"Hudaibiyah",full:"Hudaibiyah",ll:PL.hd,dx:0,dy:0},
 kh:{n:"Khaibar",full:"Khaibar",ll:PL.kh,dx:0,dy:0},
 mu:{n:"Mu’tah",full:"Mu’tah",ll:PL.mu,dx:0,dy:0},
 hu:{n:"Hunain",full:"Hunain",ll:PL.hu,dx:0,dy:0}
};
(function(){Object.keys(NODES).forEach(function(k){NODES[k].sts=[];});
  NODE_OF.forEach(function(k,i){NODES[k].sts.push(i);});})();
