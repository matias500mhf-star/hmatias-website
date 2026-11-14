(()=>{
  const grid=document.getElementById('productCatalogueGrid');
  if(!grid)return;
  const search=document.getElementById('productCatalogueSearch');
  const filters=document.getElementById('productCatalogueFilters');
  let products=[];let filter='all';let en=document.documentElement.lang==='en';
  const text=(pt,eng)=>en?eng:pt;
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const norm=value=>String(value??'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().trim();
  function render(){
    const query=norm(search?.value||'');
    const list=products.filter(p=>{
      const hay=norm([p.name,p.brand,p.category,p.description].join(' '));
      return (filter==='all'||p.filter===filter)&&(!query||hay.includes(query));
    });
    if(!list.length){grid.innerHTML='<p class="catalogue-empty">'+text('Não foram encontrados produtos com esses critérios.','No products match those filters.')+'</p>';return;}
    grid.innerHTML=list.map(p=>{
      const title=esc(p.name);
      const page=Math.max(1,Number(p.source_page)||1);
      return '<article class="catalogue-card"><div class="catalogue-card-top"><span class="catalogue-brand">'+esc(p.brand)+'</span><span class="catalogue-category">'+esc(p.category)+'</span></div><h3>'+title+'</h3><p>'+esc(p.description)+'</p><div class="catalogue-availability">'+text('Disponibilidade: sob consulta','Availability: on request')+'</div><div class="catalogue-card-actions"><span class="catalogue-reference">'+text('Referência: catálogo HMATIAS Supply 2026 · pág. ','Source: HMATIAS Supply Catalogue 2026 · p. ')+page+'</span><a class="catalogue-quote" href="rfq.html?item='+encodeURIComponent(p.id)+'">'+text('Pedir cotação','Request a quote')+'</a></div></article>';
    }).join('');
  }
  search?.addEventListener('input',render);
  filters?.addEventListener('click',event=>{const button=event.target.closest('button[data-filter]');if(!button)return;filter=button.dataset.filter;filters.querySelectorAll('button').forEach(node=>node.classList.toggle('is-active',node===button));render();});
  document.getElementById('langToggle')?.addEventListener('click',()=>{en=document.documentElement.lang==='en';render();});
  fetch('data/hmatias-product-catalog.json',{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error('catalogue');return response.json();}).then(data=>{if(!Array.isArray(data.products))throw new Error('catalogue');products=data.products;render();}).catch(()=>{grid.innerHTML='<p class="catalogue-empty">'+text('O catálogo não está disponível neste momento.','The catalogue is temporarily unavailable.')+'</p>';});
})();
