/**
 * MapeOne - Cross-domain Authentication & User Navigation Header
 * Synchronizes user state from app.mapeone.com to mapeone.com
 */

(function () {
  function getSessionCookie() {
    try {
      var match = document.cookie.match(/(?:^|;\s*)mapeone_session=([^;]*)/);
      if (match && match[1]) {
        return JSON.parse(decodeURIComponent(match[1]));
      }
    } catch (e) {
      console.warn("Error parsing mapeone_session cookie:", e);
    }
    return null;
  }

  function renderLoggedInNav(session) {
    if (!session || (!session.displayName && !session.email && !session.uid)) return;

    // Find the right auth buttons container in navbar
    var authLinks = document.querySelectorAll('nav a[href*="app.mapeone.com/login"], nav a[href*="app.mapeone.com/register"]');
    var container = null;
    if (authLinks.length > 0) {
      container = authLinks[0].closest('.flex.items-center.gap-3') || authLinks[0].parentElement;
    }

    if (!container) return;

    var displayName = session.displayName || (session.email ? session.email.split('@')[0] : 'Người dùng');
    var email = session.email || '';
    var initial = (displayName.trim()[0] || 'U').toUpperCase();
    var photo = session.photoURL || '';
    var creditsFormatted = typeof session.credits === 'number' ? session.credits.toLocaleString() : (session.credits || '0');
    var isPaid = Boolean(session.isPaidUser);

    // Format badge - Vào ứng dụng
    var badgeHtml = isPaid
      ? '<a href="https://app.mapeone.com/dashboard" title="Vào ứng dụng MapeOne" class="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50/90 text-blue-700 hover:bg-blue-100 transition-colors shadow-xs">' +
          '<i class="fa-solid fa-coins text-amber-500 text-sm"></i>' +
          '<span class="font-bold text-blue-800 text-xs md:text-sm">' + creditsFormatted + '</span>' +
          '<span class="text-blue-300">|</span>' +
          '<span class="font-bold text-blue-700 text-xs">Vào ứng dụng</span>' +
        '</a>'
      : '<a href="https://app.mapeone.com/dashboard" title="Vào ứng dụng MapeOne" class="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50/90 text-blue-700 hover:bg-blue-100 transition-colors shadow-xs">' +
          '<i class="fa-solid fa-arrow-right-to-bracket text-blue-600 text-xs"></i>' +
          '<span class="font-bold text-blue-800 text-xs md:text-sm">Vào ứng dụng</span>' +
        '</a>';

    var avatarHtml = photo
      ? '<img src="' + photo + '" class="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20" alt="Avatar" referrerpolicy="no-referrer" />'
      : '<div class="w-8 h-8 rounded-full bg-blue-100 text-primary font-bold flex items-center justify-center text-sm ring-2 ring-blue-500/20">' + initial + '</div>';

    container.innerHTML = 
      '<div class="flex items-center gap-2 md:gap-3" id="mapeone-auth-wrapper">' +
        badgeHtml +
        '<div class="relative" id="mapeone-user-dropdown-container">' +
          '<button id="mapeone-user-btn" class="flex items-center gap-2 pl-2 md:pl-3 border-l border-slate-200 cursor-pointer hover:bg-slate-100/80 rounded-xl px-2 py-1.5 transition focus:outline-none">' +
            avatarHtml +
            '<div class="hidden md:block text-left max-w-[130px]">' +
              '<p class="text-xs font-bold text-slate-800 truncate leading-tight">' + displayName + '</p>' +
              '<p class="text-[10px] text-slate-400 truncate leading-tight mt-0.5">' + (email || 'Thành viên') + '</p>' +
            '</div>' +
            '<i class="fa-solid fa-chevron-down text-[10px] text-slate-400 ml-0.5 transition-transform duration-200" id="mapeone-chevron"></i>' +
          '</button>' +

          '<div id="mapeone-user-menu" class="hidden absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[9999] transition-all">' +
            '<div class="px-4 py-3 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl">' +
              '<p class="text-xs font-bold text-slate-900 truncate">' + displayName + '</p>' +
              '<p class="text-[11px] text-slate-500 truncate">' + email + '</p>' +
              '<div class="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">' +
                '<span class="text-[10px] uppercase font-bold text-slate-400">Trạng thái:</span>' +
                '<span class="font-bold text-blue-600">' + (isPaid ? creditsFormatted + ' Credits' : 'Gói Trải Nghiệm') + '</span>' +
              '</div>' +
            '</div>' +

            '<div class="p-1 space-y-0.5">' +
              '<a href="https://app.mapeone.com/dashboard" class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50/80 text-slate-700 hover:text-primary transition font-semibold text-xs group">' +
                '<div class="w-7 h-7 rounded-lg bg-blue-100/60 text-primary flex items-center justify-center group-hover:scale-110 transition">' +
                  '<i class="fa-solid fa-gauge-high text-xs"></i>' +
                '</div>' +
                '<span>Bảng điều khiển</span>' +
              '</a>' +

              '<a href="https://app.mapeone.com/dashboard/upgrade" class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50/80 text-slate-700 hover:text-amber-600 transition font-semibold text-xs group">' +
                '<div class="w-7 h-7 rounded-lg bg-amber-100/60 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">' +
                  '<i class="fa-solid fa-bolt text-xs"></i>' +
                '</div>' +
                '<span>Nâng cấp Gói</span>' +
              '</a>' +

              '<a href="https://app.mapeone.com/dashboard/account" class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition font-semibold text-xs group">' +
                '<div class="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-110 transition">' +
                  '<i class="fa-solid fa-user-gear text-xs"></i>' +
                '</div>' +
                '<span>Cài đặt tài khoản</span>' +
              '</a>' +
            '</div>' +

            '<div class="border-t border-slate-100 mt-1 p-1">' +
              '<button id="mapeone-logout-btn" class="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 transition font-medium text-xs text-left">' +
                '<i class="fa-solid fa-arrow-right-from-bracket text-xs ml-1"></i>' +
                '<span>Đăng xuất</span>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Dropdown toggle
    var btn = document.getElementById('mapeone-user-btn');
    var menu = document.getElementById('mapeone-user-menu');
    var chevron = document.getElementById('mapeone-chevron');
    if (btn && menu) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var isHidden = menu.classList.contains('hidden');
        if (isHidden) {
          menu.classList.remove('hidden');
          if (chevron) chevron.classList.add('rotate-180');
        } else {
          menu.classList.add('hidden');
          if (chevron) chevron.classList.remove('rotate-180');
        }
      });

      document.addEventListener('click', function (e) {
        if (!menu.contains(e.target) && !btn.contains(e.target)) {
          menu.classList.add('hidden');
          if (chevron) chevron.classList.remove('rotate-180');
        }
      });
    }

    // Logout handling
    var logoutBtn = document.getElementById('mapeone-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        var isMapeone = window.location.hostname.includes('mapeone.com');
        var domainAttr = isMapeone ? '; domain=.mapeone.com' : '';
        document.cookie = 'mapeone_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT' + domainAttr + '; path=/; SameSite=Lax; Secure';
        window.location.href = 'https://app.mapeone.com/login?logout=1';
      });
    }

    // Update Hero CTA buttons
    var heroCtas = document.querySelectorAll('a[href*="app.mapeone.com/register"]');
    heroCtas.forEach(function (cta) {
      if (cta.closest('section, main, .hero-bg, [class*="hero"]')) {
        cta.href = 'https://app.mapeone.com/dashboard';
        cta.innerHTML = '<i class="fa-solid fa-gauge-high"></i> Vào Bảng điều khiển';
      }
    });
  }

  // Execute check on DOMContentLoaded or immediately if ready
  function initAuthNav() {
    var session = getSessionCookie();
    if (session) {
      renderLoggedInNav(session);
    } else {
      // Cross-origin iframe bridge to app.mapeone.com
      var iframe = document.createElement('iframe');
      iframe.src = 'https://app.mapeone.com/auth-sync.html';
      iframe.style.display = 'none';
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      window.addEventListener('message', function (event) {
        if (event.data && event.data.type === 'RESPONSE_MAPEO_SESSION' && event.data.session) {
          renderLoggedInNav(event.data.session);
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthNav);
  } else {
    initAuthNav();
  }
})();
