(() => {
  'use strict';
  const api = 'https://api.onlinegiftis.com/api/store/influencer';
  const savedKey = 'og_influencer_campaign';
  const linkKey = new URLSearchParams(location.search).get('ref');
  const keyPattern = /^[a-f0-9]{32}$/;
  const tr = (ar, turkish) => document.documentElement.lang === 'tr' ? turkish : ar;
  const errors = {
    invalid_code: ['أدخل كوداً من 3 إلى 24 رمزاً بالإنكليزي، ويبدأ بحرف أو رقم.', '3–24 karakterlik, harf veya rakamla başlayan bir kod girin.'],
    code_taken: ['هذا الكود محجوز. اختَر اسماً آخر.', 'Bu kod kullanımda. Başka bir ad seçin.'],
    code_already_set: ['تم اختيار الكود سابقاً.', 'Kod daha önce belirlendi.'],
    invalid_coupon: ['الكود غير متاح.', 'Kod kullanılamıyor.'],
    coupon_not_applicable: ['المنتج المشمول بالكود غير موجود في السلة.', 'Koda uygun ürün sepette yok.'],
    coupon_changed: ['تغيّر العرض. تحقّق من الخصم قبل تثبيت الطلب.', 'Kampanya değişti. Siparişten önce indirimi kontrol edin.'],
    order_request_conflict: ['تغيّرت بيانات المحاولة السابقة. راجع الطلب وأعد المحاولة.', 'Önceki denemenin bilgileri değişti. Siparişi kontrol edip tekrar deneyin.'],
    coupon_conflict: ['اختر كوبون المشهور أو جائزة العجلة.', 'İçerik üreticisi kodu veya çark ödülünden birini seçin.'],
  };
  function message(error) {
    const labels = errors[error];
    return labels ? tr(...labels) : tr('تعذّر التحقق. حاول مرة أخرى.', 'İşlem doğrulanamadı. Tekrar deneyin.');
  }
  async function call(path, body, authenticated = false) {
    const token = authenticated ? await window.OGCustomerAuth?.getAccessToken() : null;
    if (authenticated && !token) throw Error('sign_in_required');
    const headers = new Headers();
    if (body !== undefined) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', 'Bearer ' + token);
    const response = await fetch(api + path, { method: body === undefined ? 'GET' : 'POST', headers,
      body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw Error(result.error);
    return result;
  }

  let referral = null;
  let visitorKey;
  try {
    const saved = JSON.parse(localStorage.getItem(savedKey));
    if (keyPattern.test(saved?.key || '') && saved.expiresAt > Date.now()) referral = saved;
    visitorKey = localStorage.getItem('og_influencer_visitor');
  } catch {}
  if (!keyPattern.test(visitorKey || '')) {
    visitorKey = crypto.randomUUID().replaceAll('-', '');
    try { localStorage.setItem('og_influencer_visitor', visitorKey); } catch {}
  }
  let code = referral?.code || '';
  let quote = null;
  let pending = false;
  let failure = '';
  let cartKey = '';
  let requestVersion = 0;
  let timer;
  let checkout;
  let input;
  let cartStatus;
  let busyLink = false;
  let currentOrder;

  function storeReferral() {
    try { localStorage.setItem(savedKey, JSON.stringify(referral)); } catch {}
  }
  async function captureVisit() {
    if (!keyPattern.test(linkKey || '')) return;
    busyLink = true;
    checkout.update();
    try {
      const result = await call('/visit', { referralKey: linkKey, visitorKey });
      referral = { key: linkKey, code: result.code, expiresAt: Date.now() + 30 * 86400000 };
      storeReferral();
      selectCode(referral.code || '');
      const url = new URL(location.href);
      url.searchParams.delete('ref');
      history.replaceState(history.state, '', url);
      if (result.productId && !url.searchParams.has('cart')) {
        const product = new URL('/product.html', location.origin);
        product.searchParams.set('id', result.productId);
        product.searchParams.set('lang', document.documentElement.lang);
        location.replace(product);
      }
    } catch {}
    finally { busyLink = false; checkout.update(); }
  }

  function selectCode(value) {
    code = value.trim().toUpperCase();
    if (input) input.value = code;
    cartKey = '';
    checkout.update();
  }

  function refresh() {
    if (!checkout) return;
    const items = checkout.cart().map(({ productId, quantity }) => ({ productId, quantity }));
    const customer = checkout.customer();
    const next = JSON.stringify([code, customer?.id, items]);
    if (next === cartKey) { renderStatus(); return; }
    cartKey = next;
    const version = ++requestVersion;
    clearTimeout(timer);
    quote = null;
    failure = '';
    pending = Boolean(code && items.length);
    renderStatus();
    if (!pending) return;

    const selected = code;
    timer = setTimeout(async () => {
      try {
        const result = await call('/quote', { items, influencerCode: selected }, Boolean(customer));
        if (version === requestVersion) quote = result;
      } catch (error) {
        if (version === requestVersion) failure = error.message;
      } finally {
        if (version === requestVersion) {
          pending = false;
          checkout.update();
        }
      }
    }, 120);
  }
  function renderStatus() {
    if (!cartStatus) return;
    cartStatus.textContent = !code ? '' : checkout.wheelSelected()
      ? tr('جائزة العجلة مختارة حالياً. أزلها لاستخدام الكوبون.', 'Çark ödülü seçili. Kodu kullanmak için ödülü kaldırın.')
      : pending ? tr('جاري التحقق من الخصم…', 'İndirim kontrol ediliyor…')
        : failure ? message(failure)
          : quote ? tr('تم تفعيل الكود ', 'Kod uygulandı: ') + quote.code +
            tr(' · يطبّق عرض واحد على الطلب.', ' · Siparişe tek kampanya uygulanır.') : '';
  }

  function element(tag, value, parent) {
    const el = document.createElement(tag);
    if (value) el.textContent = value;
    parent?.append(el);
    return el;
  }
  function button(text, parent, action) {
    const el = element('button', text, parent);
    el.type = 'button';
    el.addEventListener('click', action);
    return el;
  }
  function mount(options) {
    checkout = options;
    const host = document.getElementById('influencerCheckout');
    input = host.querySelector('input');
    input.value = code;
    cartStatus = host.querySelector('[role="status"]');
    const apply = () => {
      if (!input.reportValidity()) return;
      selectCode(input.value);
    };
    host.querySelector('[data-apply]').onclick = apply;
    host.querySelector('[data-remove-code]').onclick = () => {
      if (referral) { referral.code = null; storeReferral(); }
      selectCode('');
    };
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); apply(); }
    });
    checkout.update();
    captureVisit();
  }

  let profileReport;
  let accountId;
  let loadVersion = 0;
  const statuses = {
    new: ['جديد', 'Yeni'], preparing: ['قيد التجهيز', 'Hazırlanıyor'], shipped: ['تم الشحن', 'Kargolandı'],
    delivered: ['تم التسليم', 'Teslim edildi'], cancelled: ['ملغي', 'İptal'], returned: ['مرتجع', 'İade'],
    returned_full: ['مرتجع كامل', 'Tam iade'], returned_shipping: ['مرتجع - شحن', 'İade - kargo'],
  };
  function renderDashboard(host, data) {
    host.replaceChildren();
    element('h3', tr('شريك VIP', 'VIP İş Ortağı'), host);
    const profile = data.profile;
    if (!profile?.active) { host.hidden = true; return; }
    const url = new URL(tr('/products/', '/tr/products/'), location.origin);
    url.searchParams.set('ref', profile.referralKey);
    const label = element('label', tr('رابط الإحالة الخاص بك', 'Davet bağlantınız'), host);
    const link = element('input', '', label);
    link.readOnly = true; link.value = url.href; link.dir = 'ltr';
    button(tr('نسخ الرابط', 'Bağlantıyı kopyala'), host, async event => {
      try {
        await navigator.clipboard.writeText(link.value);
        event.target.textContent = tr('تم النسخ', 'Kopyalandı');
      } catch { link.select(); }
    });
    element('p', tr('نسبة خصم المتابعين ', 'Takipçi indirimi ') + profile.discountPercent + '%' +
      (profile.couponEnabled ? '' : tr(' · بانتظار تفعيل الإدارة', ' · Yönetim onayı bekleniyor')), host);
    if (profile.code) element('p', tr('كودك ', 'Kodunuz ') + profile.code, host);
    if (!profile.code) {
      const form = element('form', '', host);
      const codeLabel = element('label', tr('اختَر اسم الكوبون', 'Kupon adını seçin'), form);
      const field = element('input', '', codeLabel);
      field.required = true; field.minLength = 3; field.maxLength = 24; field.dir = 'ltr'; field.placeholder = 'LINA10';
      const save = element('button', tr('حفظ اسم الكوبون', 'Kupon adını kaydet'), form);
      const status = element('p', '', form);
      status.setAttribute('role', 'status');
      form.onsubmit = async event => {
        event.preventDefault();
        save.disabled = true;
        const version = loadVersion;
        try {
          const updated = await call('', { code: field.value }, true);
          if (version === loadVersion) { profileReport = updated; renderDashboard(host, updated); }
        } catch (error) { status.textContent = message(error.message); }
        finally { save.disabled = false; }
      };
    }
    const stats = data.stats;
    element('p', tr('زوار الرابط (تقريبي): ', 'Bağlantı ziyaretçileri (tahmini): ') + stats.visits, host);
    element('p', tr('طلبات الإحالة: ', 'Yönlendirilen siparişler: ') + stats.orders + ' · ' +
      tr('بالكود: ', 'Kuponlu: ') + stats.couponOrders + ' · ' + tr('مسلّمة: ', 'Teslim edilen: ') + stats.deliveredOrders, host);
    if (data.orders.length) {
      element('h4', tr('أحدث الطلبات', 'Son siparişler'), host);
      const list = element('ul', '', host);
      for (const order of data.orders) {
        const status = statuses[order.status] || [order.status, order.status];
        const source = order.couponCode || tr('رابط الإحالة', 'Davet bağlantısı');
        const line = [order.orderNumber, order.createdAt.slice(0, 10), source, tr(...status)];
        if (order.discount > 0) line.push(tr('الخصم ', 'İndirim ') + order.discount + ' ₺');
        element('li', line.join(' · '), list);
      }
    }
  }

  async function syncAccount(customer, force = false) {
    const host = document.getElementById('influencerDashboard');
    const id = customer?.influencerVip ? customer.id : null;
    host.hidden = !id;
    if (!id) { accountId = null; profileReport = null; loadVersion++; host.replaceChildren(); return; }
    if (id === accountId && !force) {
      if (profileReport && host.dataset.lang !== document.documentElement.lang) {
        host.dataset.lang = document.documentElement.lang;
        renderDashboard(host, profileReport);
      }
      return;
    }
    accountId = id;
    const version = ++loadVersion;
    host.textContent = tr('جاري تحميل لوحة VIP…', 'VIP paneli yükleniyor…');
    try {
      const data = await call('', undefined, true);
      if (version !== loadVersion) return;
      profileReport = data;
      host.dataset.lang = document.documentElement.lang;
      renderDashboard(host, data);
    } catch (error) {
      if (version === loadVersion) host.textContent = message(error.message);
    }
  }

  window.OGInfluencers = {
    mount, refresh, syncAccount,
    getQuote: () => checkout && !checkout.wheelSelected() ? quote : null,
    blocked: () => busyLink || pending && !checkout?.wheelSelected(),
    orderFields(payload) {
      const fields = referral?.expiresAt > Date.now() ? { influencerReferral: referral.key } : {};
      if (!checkout.wheelSelected() && quote) {
        fields.influencerCode = quote.code;
        fields.influencerDiscountAmount = quote.discountAmount;
      }
      if ((fields.influencerReferral || fields.influencerCode) && !checkout.wheelSelected()) {
        const signature = JSON.stringify([payload, fields]);
        if (currentOrder?.signature !== signature) currentOrder = { signature, key: crypto.randomUUID() };
        fields.influencerRequestKey = currentOrder.key;
      }
      return fields;
    },
    consumed: () => { currentOrder = null; },
    orderError(error) {
      if (!Object.hasOwn(errors, error)) return null;
      if (error === 'order_request_conflict') currentOrder = null;
      if (error === 'coupon_changed' || error === 'invalid_coupon') selectCode(code);
      return message(error);
    },
  };
})();
