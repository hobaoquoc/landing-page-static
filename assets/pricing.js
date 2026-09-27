/**
 * MapeOne - Dynamic Pricing Loader
 * Fetches real-time pricing plans, tools, and packages from database via core API
 */

(function () {
  var API_BASE = "https://core.mapeone.com";
  var CACHE_KEY_PRODUCTS = "mapeone_cached_products_v2";
  var CACHE_KEY_TOOLS = "mapeone_cached_tools_v2";

  var DEFAULT_TOOLS = {
    "speech-to-text": { title: "Tách video thành văn bản", desc: "Trích xuất văn bản tự động" },
    "video-downloader": { title: "Tải video không logo", desc: "TikTok, Facebook, YouTube" },
    "idea-proposal": { title: "Đề xuất ý tưởng triệu view", desc: "Gợi ý chủ đề theo lĩnh vực" },
    "viral-script": { title: "Viết kịch bản video viral", desc: "Kịch bản thu hút triệu view" },
    "list-video": { title: "Tạo video Danh sách", desc: "Top 5, Top 10, liệt kê ý chính" },
    "voice-video": { title: "Tạo video giọng AI", desc: "Lồng tiếng AI kèm phụ đề động" },
    "auto-ai-list": { title: "Tạo video Danh sách", desc: "Top 5, Top 10, liệt kê ý chính" },
    "auto-ai-voice": { title: "Tạo video giọng AI", desc: "Lồng tiếng AI kèm phụ đề động" },
    "voice-clone": { title: "Clone giọng nói của bạn", desc: "Tạo giọng nói AI của riêng bạn" },
    "voice-use": { title: "Sử dụng giọng nói cá nhân", desc: "Đọc kịch bản bằng giọng của bạn" },
    "text-to-speech": { title: "Tạo giọng nói AI", desc: "Giọng đọc tự nhiên, truyền cảm" },
    "value-image": { title: "Tạo ảnh trao giá trị", desc: "Xây kênh mạng xã hội" },
    "auto-edit": { title: "Chỉnh sửa video tự động", desc: "Cắt ghép, hiệu ứng tự động" },
    "personal-video": { title: "Video nhân vật ảo", desc: "Khuôn mặt của chính bạn" },
    "image-enhance": { title: "Làm nét ảnh", desc: "Khôi phục ảnh mờ bằng AI" }
  };

  var DEFAULT_PRODUCTS = [
    {
      id: "product_script_assistant",
      name: "Mape Content",
      subtitle: "Trợ lý AI tìm ý tưởng & viết kịch bản video",
      tools: ["idea-proposal", "viral-script", "speech-to-text", "video-downloader"],
      packages: [
        { id: "script_1m", name: "Hàng Tháng", price: 500000, credits: 700, duration_days: 30 },
        { id: "script_3m", name: "3 Tháng", price: 1350000, credits: 2250, duration_days: 90 },
        { id: "script_1y", name: "Hàng Năm", price: 4200000, credits: 9200, duration_days: 365 }
      ],
      benefits: ["Cập nhật tính năng mới liên tục", "Hỗ trợ kỹ thuật 24/7", "Không giới hạn số lượng kịch bản"],
      sort_order: 1,
      is_active: true
    },
    {
      id: "product_ai_video",
      name: "Mape Viral",
      subtitle: "Phần mềm AI tạo video tự động",
      tools: ["list-video", "voice-video", "voice-clone", "voice-use"],
      packages: [
        { id: "video_1m", name: "Hàng Tháng", price: 800000, credits: 270, duration_days: 30 },
        { id: "video_3m", name: "3 Tháng", price: 1980000, credits: 810, duration_days: 90 },
        { id: "video_1y", name: "Hàng Năm", price: 6000000, credits: 3240, duration_days: 365 }
      ],
      benefits: [
        "Không giới hạn số lượt theo ngày",
        "Bao gồm cả Video Danh sách & Video Giọng AI",
        "Xuất video siêu tốc trên Cloud VPS 8 nhân",
        "Hết lượt nạp thêm credits sử dụng ngay"
      ],
      sort_order: 2,
      is_active: true
    },
    {
      id: "product_free",
      name: "Trải nghiệm Miễn phí",
      subtitle: "Dành cho người mới bắt đầu",
      tools: ["speech-to-text", "video-downloader", "idea-proposal", "viral-script", "auto-ai-list", "auto-ai-voice", "voice-clone", "voice-use"],
      packages: [
        { id: "free_0", name: "Gói Trải Nghiệm", price: 0, credits: 0, duration_days: 3650, description: "Trải nghiệm miễn phí các công cụ AI tạo kịch bản & video triệu view." }
      ],
      benefits: [
        "Tự động kích hoạt ngay sau khi đăng ký tài khoản",
        "Tặng 3 lượt tách & tải video mỗi ngày",
        "3 lượt trải nghiệm tạo kịch bản & video AI",
        "Không yêu cầu thẻ tín dụng hay nạp tiền"
      ],
      sort_order: 3,
      is_active: true
    }
  ];

  var state = {
    products: [],
    toolsMap: { ...DEFAULT_TOOLS },
    activeProductId: null,
    isDark: true
  };

  function getCachedData(key) {
    try {
      var raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Pricing cache read error:", e);
    }
    return null;
  }

  function setCachedData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }

  function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString("vi-VN") + "đ";
  }

  function renderTabs(container) {
    if (!container) return;
    var html = '<div class="inline-flex p-1.5 rounded-2xl ' + (state.isDark ? 'bg-slate-800/90 border border-slate-700/80' : 'bg-slate-200/70 border border-slate-300/60') + ' gap-1.5 shadow-inner max-w-full overflow-x-auto">';

    state.products.forEach(function (prod) {
      var isActive = prod.id === state.activeProductId;
      var activeClass = state.isDark
        ? (isActive ? 'bg-primary text-white shadow-lg shadow-blue-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-700/60')
        : (isActive ? 'bg-white text-slate-900 shadow-md font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50');

      var icon = prod.id === 'product_ai_video' ? 'fa-clapperboard' : prod.id === 'product_free' ? 'fa-gift' : 'fa-pen-nib';

      html += '<button type="button" data-product-id="' + prod.id + '" class="pricing-tab-btn flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ' + activeClass + '">' +
        '<i class="fa-solid ' + icon + ' text-xs"></i>' +
        '<span>' + prod.name + '</span>' +
      '</button>';
    });

    html += '</div>';
    container.innerHTML = html;

    // Attach click events
    var buttons = container.querySelectorAll('.pricing-tab-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pid = this.getAttribute('data-product-id');
        if (pid && pid !== state.activeProductId) {
          state.activeProductId = pid;
          renderTabs(container);
          var cardsContainer = document.getElementById('pricing-cards-container');
          if (cardsContainer) {
            renderCards(cardsContainer);
          }
        }
      });
    });
  }

  function renderCards(container) {
    if (!container) return;

    var product = state.products.find(function (p) {
      return p.id === state.activeProductId;
    }) || state.products[0];

    if (!product) return;

    var packages = product.packages || [];
    var isFree = product.id === 'product_free' || (packages.length === 1 && packages[0].price === 0);

    var html = '';

    if (isFree) {
      // Single wide card for Free tier
      var pkg = packages[0] || { name: "Gói Trải Nghiệm", price: 0, duration_days: 3650 };
      var cardBg = state.isDark
        ? 'bg-slate-800/90 border-slate-700/80 text-white'
        : 'bg-white border-slate-200 text-slate-800 shadow-xl';

      html += '<div class="col-span-1 md:col-span-3 max-w-2xl mx-auto w-full ' + cardBg + ' rounded-3xl p-8 md:p-10 border shadow-2xl relative transition-all duration-300">' +
        '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ' + (state.isDark ? 'border-slate-700 pb-6 mb-6' : 'border-slate-100 pb-6 mb-6') + '">' +
          '<div>' +
            '<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">' +
              '<i class="fa-solid fa-gift"></i> Miễn phí 100%' +
            '</div>' +
            '<h3 class="text-3xl font-extrabold">' + pkg.name + '</h3>' +
            '<p class="' + (state.isDark ? 'text-slate-400' : 'text-slate-500') + ' text-sm mt-1">' + (product.subtitle || 'Dành cho người mới bắt đầu trải nghiệm hệ thống MapeOne') + '</p>' +
          '</div>' +
          '<div class="text-left sm:text-right">' +
            '<div class="text-4xl md:text-5xl font-black text-primary">0đ</div>' +
            '<div class="' + (state.isDark ? 'text-slate-400' : 'text-slate-500') + ' text-xs mt-0.5">Không yêu cầu thẻ tín dụng</div>' +
          '</div>' +
        '</div>' +

        '<div class="mb-8">' +
          '<p class="text-xs font-bold uppercase tracking-wider ' + (state.isDark ? 'text-slate-400' : 'text-slate-500') + ' mb-4">Các tính năng & quyền lợi bao gồm:</p>' +
          '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">';

      (product.tools || []).forEach(function (toolId) {
        var tInfo = state.toolsMap[toolId] || { title: toolId };
        var quotaText = (toolId === 'speech-to-text' || toolId === 'video-downloader')
          ? '<span class="text-xs text-emerald-400 font-semibold ml-1">(3 lượt/ngày)</span>'
          : '<span class="text-xs text-blue-400 font-semibold ml-1">(3 lượt dùng)</span>';

        html += '<div class="flex items-start gap-2.5 text-sm ' + (state.isDark ? 'text-slate-300' : 'text-slate-700') + '">' +
          '<i class="fa-solid fa-circle-check text-emerald-500 mt-1 shrink-0"></i>' +
          '<span>' + tInfo.title + ' ' + quotaText + '</span>' +
        '</div>';
      });

      (product.benefits || []).forEach(function (b) {
        html += '<div class="flex items-start gap-2.5 text-sm ' + (state.isDark ? 'text-slate-300' : 'text-slate-700') + '">' +
          '<i class="fa-solid fa-sparkles text-amber-400 mt-1 shrink-0"></i>' +
          '<span>' + b + '</span>' +
        '</div>';
      });

      html += '</div></div>' +
        '<a href="https://app.mapeone.com/register" class="w-full py-4 px-6 bg-primary hover:bg-blue-600 text-white text-center font-bold text-lg rounded-2xl transition-all shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2">' +
          '<i class="fa-solid fa-rocket"></i> Bắt đầu Trải nghiệm Miễn phí' +
        '</a>' +
      '</div>';

    } else {
      // Grid of 3 packages (Hàng Tháng / 3 Tháng / Hàng Năm)
      packages.forEach(function (pkg, index) {
        var durationMonths = Math.max(1, Math.round(pkg.duration_days / 30));
        var monthlyPrice = Math.round(pkg.price / durationMonths);
        var isBestDeal = durationMonths >= 10; // Hàng Năm (12 tháng)
        var isPopular = durationMonths >= 2 && durationMonths <= 4; // 3 Tháng

        var cardClass = '';
        var badgeHtml = '';
        var buttonClass = '';

        if (isBestDeal) {
          cardClass = state.isDark
            ? 'bg-gradient-to-b from-blue-900/90 via-slate-800 to-slate-900 border-2 border-blue-400 shadow-2xl shadow-blue-500/20 md:-translate-y-3 z-10'
            : 'bg-white border-2 border-primary shadow-2xl shadow-blue-500/15 md:-translate-y-3 z-10';
          badgeHtml = '<div class="absolute -top-3.5 right-6 bg-yellow-400 text-yellow-950 font-black text-[11px] px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5">' +
            '<i class="fa-solid fa-crown text-[10px]"></i> TIẾT KIỆM 30% - VIP' +
          '</div>';
          buttonClass = 'bg-primary hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30';
        } else if (isPopular) {
          cardClass = state.isDark
            ? 'bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 shadow-xl'
            : 'bg-white border border-slate-200 hover:border-blue-300 shadow-lg';
          badgeHtml = '<div class="absolute -top-3 right-6 bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">' +
            'PHỔ BIẾN' +
          '</div>';
          buttonClass = state.isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white';
        } else {
          cardClass = state.isDark
            ? 'bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 shadow-xl'
            : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm';
          buttonClass = state.isDark ? 'bg-slate-700/80 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800';
        }

        var buyUrl = 'https://app.mapeone.com/dashboard/upgrade?product=' + encodeURIComponent(product.id) + '&package=' + encodeURIComponent(pkg.id);

        html += '<div class="rounded-3xl p-7 flex flex-col justify-between relative transition-all duration-300 ' + cardClass + '">' +
          badgeHtml +
          '<div>' +
            '<div class="flex items-center justify-between mb-2">' +
              '<h3 class="text-xl font-bold ' + (state.isDark ? 'text-white' : 'text-slate-900') + '">' + pkg.name + '</h3>' +
              (pkg.credits ? '<span class="text-xs font-bold px-2.5 py-1 rounded-full ' + (isBestDeal ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-blue-500/10 text-blue-400 border border-blue-400/20') + ' flex items-center gap-1"><i class="fa-solid fa-coins text-[10px]"></i> ' + pkg.credits.toLocaleString('vi-VN') + ' lượt</span>' : '') +
            '</div>' +

            '<div class="my-5">' +
              '<div class="flex items-baseline gap-1.5">' +
                '<span class="text-4xl font-extrabold ' + (state.isDark ? 'text-white' : 'text-slate-900') + '">' + formatCurrency(monthlyPrice) + '</span>' +
                '<span class="' + (state.isDark ? 'text-slate-400' : 'text-slate-500') + ' text-sm font-semibold">/ tháng</span>' +
              '</div>' +
              '<div class="text-xs ' + (state.isDark ? 'text-slate-400' : 'text-slate-500') + ' mt-1">' +
                (durationMonths > 1
                  ? 'Tổng ' + formatCurrency(pkg.price) + ' cho ' + durationMonths + ' tháng'
                  : 'Thanh toán linh hoạt từng tháng') +
              '</div>' +
            '</div>' +

            '<div class="border-t ' + (state.isDark ? 'border-slate-700/60 pt-5' : 'border-slate-100 pt-5') + ' mb-6">' +
              '<p class="text-xs font-bold uppercase tracking-wider ' + (state.isDark ? 'text-slate-400' : 'text-slate-500') + ' mb-3">Quyền lợi gói:</p>' +
              '<ul class="space-y-3 text-sm ' + (state.isDark ? 'text-slate-300' : 'text-slate-600') + '">';

        // Render included tools
        (product.tools || []).forEach(function (toolId) {
          var tInfo = state.toolsMap[toolId] || { title: toolId };
          html += '<li class="flex items-start gap-2.5">' +
            '<i class="fa-solid fa-check text-emerald-400 mt-1 shrink-0 text-xs"></i>' +
            '<span class="leading-tight">' + tInfo.title + '</span>' +
          '</li>';
        });

        // Render package/product benefits
        (product.benefits || []).forEach(function (b) {
          html += '<li class="flex items-start gap-2.5">' +
            '<i class="fa-solid fa-check ' + (isBestDeal ? 'text-yellow-400' : 'text-emerald-400') + ' mt-1 shrink-0 text-xs"></i>' +
            '<span class="leading-tight font-medium">' + b + '</span>' +
          '</li>';
        });

        html += '</ul></div></div>' +
          '<div class="mt-4 pt-2">' +
            '<a href="' + buyUrl + '" class="w-full py-3.5 px-4 rounded-xl text-center font-bold transition-all block text-sm ' + buttonClass + '">' +
              'Đăng ký Gói ' + pkg.name +
            '</a>' +
          '</div>' +
        '</div>';
      });
    }

    container.innerHTML = html;
  }

  function initPricing() {
    var tabsContainer = document.getElementById('pricing-tabs-container');
    var cardsContainer = document.getElementById('pricing-cards-container');

    if (!tabsContainer && !cardsContainer) return;

    // Detect theme
    var pricingSection = document.getElementById('pricing') || document.querySelector('section#pricing');
    state.isDark = pricingSection ? pricingSection.classList.contains('bg-slate-900') || !pricingSection.classList.contains('bg-slate-50') : true;

    // 1. Initial render from cache or defaults (Instant 0ms display)
    var cachedProds = getCachedData(CACHE_KEY_PRODUCTS);
    var cachedTools = getCachedData(CACHE_KEY_TOOLS);

    state.products = (cachedProds && cachedProds.length > 0) ? cachedProds : DEFAULT_PRODUCTS;
    if (cachedTools) state.toolsMap = cachedTools;

    state.activeProductId = state.products[0] ? state.products[0].id : 'product_script_assistant';

    renderTabs(tabsContainer);
    renderCards(cardsContainer);

    // 2. Fetch fresh data from core API in background
    Promise.all([
      fetch(API_BASE + '/api/public/products').then(function (r) { return r.json(); }),
      fetch(API_BASE + '/api/public/tools').then(function (r) { return r.json(); }).catch(function () { return { status: 'error' }; })
    ]).then(function (results) {
      var prodRes = results[0];
      var toolRes = results[1];

      // Update tools map
      if (toolRes && toolRes.status === 'success' && Array.isArray(toolRes.data)) {
        var tMap = { ...DEFAULT_TOOLS };
        toolRes.data.forEach(function (t) {
          if (t.id && t.title) {
            tMap[t.id] = { title: t.title, desc: t.desc_text || '' };
          }
        });
        state.toolsMap = tMap;
        setCachedData(CACHE_KEY_TOOLS, tMap);
      }

      // Update products
      if (prodRes && prodRes.status === 'success' && Array.isArray(prodRes.data) && prodRes.data.length > 0) {
        var activeProds = prodRes.data.filter(function (p) {
          return p.is_active === true;
        });

        // Ensure proper sort order: Mape Content (sort_order 2) -> Mape Viral (sort_order 3) -> Free (sort_order 1 or last)
        // Usually paid products are shown first on SaaS landing page
        activeProds.sort(function (a, b) {
          var orderA = a.id === 'product_free' ? 99 : (a.sort_order || 0);
          var orderB = b.id === 'product_free' ? 99 : (b.sort_order || 0);
          return orderA - orderB;
        });

        state.products = activeProds;
        setCachedData(CACHE_KEY_PRODUCTS, activeProds);

        // Keep active selection if still valid, otherwise default to first paid product
        if (!state.products.some(function (p) { return p.id === state.activeProductId; })) {
          state.activeProductId = state.products[0].id;
        }

        renderTabs(tabsContainer);
        renderCards(cardsContainer);
      }
    }).catch(function (err) {
      console.warn("Pricing live sync fallback:", err);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPricing);
  } else {
    initPricing();
  }
})();
