import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const paths=['facilities.html','facilities-en.html','clean.html','clean-en.html'];
const viewports=[{name:'mobile',width:390,height:844},{name:'desktop',width:1380,height:880}];
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
let errors=[];
await fs.mkdir('facilities-previews',{recursive:true});
try {
  for(const path of paths){
    for(const view of viewports){
      const page=await browser.newPage({viewport:{width:view.width,height:view.height},deviceScaleFactor:1});
      try{
        const r=await page.goto('http://127.0.0.1:8080/'+path,{waitUntil:'domcontentloaded',timeout:25000});
        if(!r||!r.ok())throw Error('Page HTTP status '+r?.status());
        let actual=null;
        if(path.startsWith('clean')){
          const product=page.locator('img[data-hmatias-product-photo="taurus"]');
          if(await product.count()!==1)throw Error('Expected exactly one Taurus product picture on the HMATIAS Clean catalogue page');
          await product.scrollIntoViewIfNeeded();
          await product.evaluate(async img => {if(!img.complete)await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject});await img.decode()});
          actual=await product.evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight,src:img.getAttribute('src'),rect:img.getBoundingClientRect().toJSON()}));
          if(actual.width<350||actual.height<350||!actual.src.includes('taurus-pine-gel-t563p-official.jpg'))throw Error('Taurus picture did not load as the official image: '+JSON.stringify(actual));
          if(actual.rect.width<120||actual.rect.height<120)throw Error('Taurus product photograph is too small visually');
        } else {
          const evidence=page.locator('.facility-evidence .hm-evidence-item img');
          if(await evidence.count()!==3)throw Error('Three documented facilities photographs missing');
          for(let i=0;i<await evidence.count();i++){
            const image=evidence.nth(i);
            await image.scrollIntoViewIfNeeded();
            await image.evaluate(async img=>{
              if(!img.complete)await new Promise((resolve,reject)=>{
                img.addEventListener('load',resolve,{once:true});
                img.addEventListener('error',reject,{once:true});
              });
              await img.decode();
              if(img.naturalWidth===0)throw Error('Image has no intrinsic width: '+img.getAttribute('src'));
            });
          }
        }
        const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
        if(width.scroll-width.inner>8)throw Error('Horizontal page overflow: '+JSON.stringify(width));
        if(path.startsWith('clean') && await page.locator('.clean-feature-card').count()!==2)throw Error('Two HMATIAS Clean product reference cards missing');
        const file='facilities-previews/'+path.replace('.html','')+'-'+view.name+'.png';
        await page.screenshot({path:file,fullPage:true,animations:'disabled',timeout:25000});
        console.log('PASS',path,view.name,actual?actual.width+'x'+actual.height:'three evidence photos','overflow=',width.scroll-width.inner,'screenshot',file);
      }catch(err){
        errors.push({path,viewport:view.name,error:String(err)});
        console.error('FAIL',path,view.name,String(err));
      }finally{await page.close()}
    }
  }
}finally{await browser.close()}
if(errors.length){console.error(JSON.stringify(errors,null,2));process.exitCode=1}
