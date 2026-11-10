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
      const pageErrors=[];
      const failedLocalResources=[];
      page.on('pageerror',error=>pageErrors.push(error.message));
      page.on('requestfailed',request=>{
        try{if(new URL(request.url()).origin==='http://127.0.0.1:8080')failedLocalResources.push(request.url()+' — '+request.failure()?.errorText)}
        catch{}
      });
      page.on('response',response=>{
        try{if(new URL(response.url()).origin==='http://127.0.0.1:8080'&&response.status()>=400)failedLocalResources.push(response.status()+' '+response.url())}
        catch{}
      });
      try{
        const r=await page.goto('http://127.0.0.1:8080/'+path,{waitUntil:'domcontentloaded',timeout:25000});
        if(!r||!r.ok())throw Error('Page HTTP status '+r?.status());
        let visualCheck='Facilities service layout';
        if(path.startsWith('facilities')){
          const cleanLink=page.locator('#hmatias-clean a[href*="clean"]');
          if(await cleanLink.count()!==1)throw Error('Expected one clear HMATIAS Clean destination');
          if(await page.locator('img[data-hmatias-product-photo="taurus"]').count()!==0)throw Error('Product photo duplicated on Facilities service page');
          const expectedClean=path.endsWith('-en.html')?'clean-en.html':'clean.html';
          if(await cleanLink.getAttribute('href')!==expectedClean)throw Error('HMATIAS Clean link points to the wrong language destination');
          if(await page.locator('#hmatias-clean h2').count()!==1)throw Error('HMATIAS Clean handoff heading missing');
        }else{
          const productCards=page.locator('.clean-feature-card');
          if(await productCards.count()!==2)throw Error('Two HMATIAS Clean product reference cards missing');
          const product=page.locator('img[data-hmatias-product-photo="taurus"]');
          if(await product.count()!==1)throw Error('Expected exactly one Taurus product picture on HMATIAS Clean');
          await product.scrollIntoViewIfNeeded();
          await product.evaluate(async img => {if(!img.complete)await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject});await img.decode()});
          const actual=await product.evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight,src:img.getAttribute('src'),rect:img.getBoundingClientRect().toJSON()}));
          if(actual.width<350||actual.height<350||!actual.src.includes('taurus-pine-gel-t563p-official.jpg'))throw Error('Taurus picture did not load as the official image: '+JSON.stringify(actual));
          if(actual.rect.width<120||actual.rect.height<120)throw Error('Taurus product photograph is too small visually');
          visualCheck=actual.width+'x'+actual.height;
        }
        const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
        if(width.scroll-width.inner>8)throw Error('Horizontal page overflow: '+JSON.stringify(width));
        const file='facilities-previews/'+path.replace('.html','')+'-'+view.name+'.png';
        await page.screenshot({path:file,fullPage:true,animations:'disabled',timeout:25000});
        await page.waitForTimeout(150);
        if(pageErrors.length)throw Error('Uncaught page errors: '+pageErrors.join(' | '));
        if(failedLocalResources.length)throw Error('Failed local resources: '+failedLocalResources.join(' | '));
        console.log('PASS',path,view.name,visualCheck,'overflow=',width.scroll-width.inner,'screenshot',file);
      }catch(err){
        errors.push({path,viewport:view.name,error:String(err)});
        console.error('FAIL',path,view.name,String(err));
      }finally{await page.close()}
    }
  }
}finally{await browser.close()}
if(errors.length){console.error(JSON.stringify(errors,null,2));process.exitCode=1}
