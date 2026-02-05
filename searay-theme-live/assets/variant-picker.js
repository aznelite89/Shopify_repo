// assets/variant-picker.js
function initVariantPicker(productInfoEl) {
  if (!productInfoEl) return;

  const variants   = window.variants || [];
  // const form       = productInfoEl.querySelector('form[id^="product-form-"]');
  const form       = productInfoEl.querySelector('form[data-type="add-to-cart-form"]');
  const idInput    = form.querySelector('input[name="id"]');
  const alloyBtns  = productInfoEl.querySelectorAll('.option-alloy .option-btn');
  const lengthBtns = productInfoEl.querySelectorAll('.option-length .option-btn');
  const sectionId  = productInfoEl.dataset.section;
  const priceSelector = `#price-${sectionId}`;

  function fetchAndReplacePrice(variantId) {
    console.log('[variant-picker] fetchAndReplacePrice → variantId=', variantId);
    const quickId = productInfoEl.dataset.section;                      // "quickadd-template--17868791316633__main"
    const origId  = productInfoEl.dataset.originalSection               // "template--17868791316633__main"
                  || quickId.replace(/^quickadd-/, '');
  
    const url = `${ productInfoEl.getAttribute('data-url') || window.location.pathname
                 }?variant=${variantId}&section_id=${origId}`;
  
    fetch(url)
      .then(r => r.text())
      .then(htmlText => {
        const tmp = document.createElement('div');
        tmp.innerHTML = htmlText;

        const newPrice     = tmp.querySelector(`#price-${origId}`);

        const priceCurrent = productInfoEl.querySelector(`#price-${quickId}`);
  
        if (newPrice && priceCurrent) {
          priceCurrent.innerHTML = newPrice.innerHTML;

          console.log('[variant-picker] updated dynamic buttons href/data-url');

          productInfoEl
                .querySelectorAll('.dynamic-checkout__button, .shopify-payment-button')
                .forEach(btn => {
                  // 有的主题是 <a href="…">，有的是 <button data-url="…">
                  const linkAttr = btn.tagName === 'A' ? 'href' : 'data-url';
                  const urlStr   = btn.getAttribute(linkAttr);
                  if (!urlStr) return;
                  const url = new URL(urlStr, window.location.origin);
                  url.searchParams.set('variant', variantId);
                  btn.setAttribute(linkAttr, url.toString());
                });
          
          if (window.Shopify && Shopify.PaymentButton) {
            Shopify.PaymentButton.init();
          }
        }
      });
  }

  function refreshLengths(selectedAlloy) {
    lengthBtns.forEach(btn => {
      const len     = btn.dataset.lengthValue;
      const matches = variants.filter(v => v.options[0] === selectedAlloy && v.options[1] === len);
      const ok      = matches.some(v => v.available);
      btn.style.display = matches.length ? '' : 'none';
      btn.disabled      = !ok;
      btn.classList.toggle('is-disabled', !ok);
    });
  }

  function toggleBuyButtons(disabled) {
    productInfoEl.querySelectorAll(
      '.product-form__submit, .dynamic-checkout__button'
    ).forEach(btn => {
      btn.disabled = disabled;
      btn.classList.toggle('is-disabled', disabled);
    });
  }

  alloyBtns.forEach(btn =>
    btn.addEventListener('click', () => {
      alloyBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      lengthBtns.forEach(b => b.classList.remove('is-active'));
      idInput.value = '';
      idInput.dispatchEvent(new Event('change', { bubbles: true }));
      publish && publish(PUB_SUB_EVENTS.optionValueSelectionChange, {
         data: {
           event: new Event('click'),
           target: btn,
           selectedOptionValues: [btn.dataset.optionValue, null]
         }
       });
      productInfoEl.querySelector(priceSelector).innerHTML = '';
      toggleBuyButtons(true);
      refreshLengths(btn.dataset.optionValue);

      if (lengthBtns.length === 0) {
        const variant = variants.find(v => v.options[0] === btn.dataset.optionValue);
        if (!variant) return;
        idInput.value = variant.id;
        idInput.dispatchEvent(new Event('change', { bubbles: true }));
        publish && publish(PUB_SUB_EVENTS.optionValueSelectionChange, {
           data: {
             event: new Event('click'),
             target: btn,
             selectedOptionValues: [btn.dataset.optionValue, null]
           }
         });
        fetchAndReplacePrice(variant.id);
        console.log("2222 done")
        const bc = productInfoEl.querySelector('#product-barcode');
        if (bc) bc.textContent = variant.barcode ? 'Barcode: ' + variant.barcode : 'Barcode: Not available';
        toggleBuyButtons(false);
      }
    })
  );

  lengthBtns.forEach(btn =>
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      lengthBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const alloy  = productInfoEl.querySelector('.option-alloy .is-active').dataset.optionValue;
      const length = btn.dataset.lengthValue;
      const variant = variants.find(v => v.options[0] === alloy && v.options[1] === length);
      if (!variant) return;
      idInput.value = variant.id;
      idInput.dispatchEvent(new Event('change', { bubbles: true }));
      publish && publish(PUB_SUB_EVENTS.optionValueSelectionChange, {
         data: {
           event: new Event('click'),
           target: btn,
           selectedOptionValues: [btn.dataset.optionValue, null]
         }
       });
      fetchAndReplacePrice(variant.id);
      const bc = productInfoEl.querySelector('#product-barcode');
      if (bc) bc.textContent = variant.barcode ? 'Barcode: ' + variant.barcode : 'Barcode: Not available';
      toggleBuyButtons(false);
    })
  );

const initAlloy = productInfoEl.querySelector('.option-alloy .is-active');
  if (initAlloy) refreshLengths(initAlloy.dataset.optionValue);
}

function scanAndInit(root = document) {
  root
    .querySelectorAll('product-info')
    .forEach(el => initVariantPicker(el));
}

window.addEventListener('DOMContentLoaded', () => scanAndInit());

window.addEventListener('shopify:section:load', e => {
  scanAndInit(e.target);
});

document.body.addEventListener('quick-add:open', () => scanAndInit());
