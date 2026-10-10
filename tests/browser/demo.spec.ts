import { expect, test } from '@playwright/test';
test('streaming, reader intent, jump, cancel and reset', async ({page}) => {
  await page.goto('/');
  await page.getByLabel('Characters per chunk').fill('120');
  await page.getByLabel('Chunks per second').fill('200');
  await page.getByRole('button',{name:'Start stream'}).click();
  await expect(page.getByRole('status',{name:'Stream status'})).toHaveText('completed');
  const output=page.getByRole('region',{name:'Markdown output'});
  expect(await output.evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop)).toBeLessThanOrEqual(2);
  await output.hover(); await page.mouse.wheel(0,-400);
  await expect(page.getByText('Reading earlier')).toBeVisible();
  await page.getByRole('button',{name:'Jump to latest'}).click();
  expect(await output.evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop)).toBeLessThanOrEqual(2);
  await output.focus(); await page.keyboard.press('PageUp'); await expect(page.getByText('Reading earlier')).toBeVisible();
  await page.getByRole('button',{name:'Reset',exact:true}).click(); await expect(page.getByRole('status',{name:'Stream status'})).toHaveText('pending');
  await page.getByLabel('Characters per chunk').fill('1');
  await page.getByRole('button',{name:'Start stream'}).click();
  await expect(page.getByRole('status',{name:'Stream status'})).toHaveText('streaming');
  await page.getByRole('button',{name:'Cancel',exact:true}).click(); await expect(page.getByRole('status',{name:'Stream status'})).toHaveText('cancelled');
});
test('untrusted samples execute no script and fetch no remote resources', async ({page}) => {
  const remote:string[]=[]; page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4173'))remote.push(r.url());});
  let dialog=false; page.on('dialog',async d=>{dialog=true;await d.dismiss();});
  await page.goto('/'); await page.getByRole('button',{name:'Safety sample'}).click();
  await page.getByLabel('Characters per chunk').fill('120'); await page.getByLabel('Chunks per second').fill('200');
  await page.getByRole('button',{name:'Start stream'}).click(); await expect(page.getByRole('status',{name:'Stream status'})).toHaveText('completed');
  const output=page.getByRole('region',{name:'Markdown output'}); await expect(output.locator('script,img,iframe,a')).toHaveCount(0);
  expect(dialog).toBe(false); expect(remote).toEqual([]);
});
test('keeps the reader position and focus while new content and resize arrive', async ({page}) => {
  await page.goto('/');
  await page.getByLabel('Markdown source').fill(Array.from({length:300},(_,i)=>`## Section ${i}\n\nA growing answer with several words in each paragraph.\n\n`).join(''));
  await page.getByLabel('Characters per chunk').fill('40'); await page.getByLabel('Chunks per second').fill('100');
  await page.getByRole('button',{name:'Start stream'}).click();
  const output=page.getByRole('region',{name:'Markdown output'});
  await expect.poll(()=>output.evaluate(el=>el.scrollTop)).toBeGreaterThan(500);
  await output.focus(); await page.keyboard.press('Home');
  await expect(page.getByText('Reading earlier')).toBeVisible();
  await expect.poll(()=>output.evaluate(el=>el.scrollTop)).toBeLessThan(2);
  const previous=await output.textContent();
  await expect.poll(()=>output.textContent()).not.toBe(previous);
  await page.setViewportSize({width:1000,height:800});
  expect(await output.evaluate(el=>el.scrollTop)).toBeLessThan(2); await expect(output).toBeFocused();
  await page.getByRole('button',{name:'Jump to latest'}).click();
  await expect(page.getByText('Following latest')).toBeVisible();
  await output.evaluate(el => {
    for (const [type, y] of [['touchstart',100],['touchmove',160]] as const) {
      el.dispatchEvent(new TouchEvent(type,{bubbles:true,touches:[new Touch({identifier:1,target:el,clientY:y})]}));
    }
  });
  await expect(page.getByText('Reading earlier')).toBeVisible();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
});
