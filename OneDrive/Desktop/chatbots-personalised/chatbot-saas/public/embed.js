(function() {
  // Prevent multiple initializations if script is included twice
  if (window.NexusChatInitialized) return;
  window.NexusChatInitialized = true;

  // 1. Find the script tag to extract data-client
  const scriptTags = document.getElementsByTagName('script');
  let clientSlug = null;
  let hostUrl = 'http://localhost:3000'; // Default fallback
  
  for (let tag of scriptTags) {
    if (tag.src.includes('embed.js') && tag.getAttribute('data-client')) {
      clientSlug = tag.getAttribute('data-client');
      // Dynamically infer the host URL from where the script is hosted
      const url = new URL(tag.src);
      hostUrl = url.origin;
      break;
    }
  }

  // Fallback if data-client is missing but configured globally
  if (!clientSlug && window.NexusChatConfig?.client) {
    clientSlug = window.NexusChatConfig.client;
  }

  if (!clientSlug) {
    console.error('NexusChat Embed: Missing data-client attribute on script tag.');
    return;
  }

  // Configuration state
  let config = null;
  let isOpen = false;

  // DOM Elements
  let container, button, iframeContainer, iframe;

  // 2. Initialize the widget
  async function init() {
    try {
      // Fetch visual branding config so we can color the floating button correctly
      const res = await fetch(`${hostUrl}/api/embed/${clientSlug}`);
      if (!res.ok) {
        if (res.status === 404) {
          // Client deleted or subscription cancelled (inactive)
          // Gracefully and silently fail so the customer's site is unaffected
          return;
        }
        console.error('NexusChat Embed: Failed to load widget configuration.');
        return;
      }
      const data = await res.json();
      config = data.config;
      
      render();
    } catch (err) {
      console.error('NexusChat Embed Error:', err);
    }
  }

  // 3. Render the UI
  function render() {
    const primaryColor = config.primaryColor || '#2563eb';
    const position = config.position || 'bottom-right';
    
    // Create master container
    container = document.createElement('div');
    container.id = 'nexuschat-widget-container';
    
    const positionStyles = position === 'bottom-left' 
      ? 'bottom: 24px; left: 24px;' 
      : 'bottom: 24px; right: 24px;';

    container.style.cssText = `
      position: fixed;
      ${positionStyles}
      z-index: 2147483647; /* Maximum z-index to stay on top of everything */
      display: flex;
      flex-direction: column;
      align-items: ${position === 'bottom-left' ? 'flex-start' : 'flex-end'};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    `;

    // Add Mobile Responsive Styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @media (max-width: 640px) {
        #nexuschat-widget-container {
          bottom: 0 !important;
          right: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 0 !important; /* Let children dictate height naturally or full screen when open */
          align-items: stretch !important;
        }
        #nexuschat-widget-iframe-container {
          width: 100% !important;
          max-width: 100% !important;
          height: 100dvh !important;
          max-height: 100dvh !important;
          border-radius: 0 !important;
          margin-bottom: 0 !important;
          border: none !important;
        }
        #nexuschat-widget-button {
          position: fixed !important;
          bottom: 20px !important;
          right: 20px !important;
        }
        .nexuschat-widget-open #nexuschat-widget-button {
          display: none !important; /* Hide button on mobile when chat is open */
        }
      }
    `;
    document.head.appendChild(styleSheet);

    // Create iframe container (hidden by default)
    iframeContainer = document.createElement('div');
    iframeContainer.id = 'nexuschat-widget-iframe-container';
    iframeContainer.style.cssText = `
      width: 100vw;
      height: 100dvh;
      max-width: 400px;
      max-height: 700px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px -10px rgba(0,0,0,0.2), 0 0 20px rgba(0,0,0,0.05);
      border: 1px solid #e5e7eb;
      overflow: hidden;
      margin-bottom: 20px;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      display: none; /* Hide entirely until needed */
    `;

    // Create iframe pointing to the Next.js widget page
    iframe = document.createElement('iframe');
    iframe.src = `${hostUrl}/widget/${clientSlug}`;
    iframe.title = "Chatbot Support";
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
    `;
    iframeContainer.appendChild(iframe);

    // Create floating action button
    button = document.createElement('button');
    button.id = 'nexuschat-widget-button';
    button.ariaLabel = "Open Chat";
    button.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background-color: ${primaryColor};
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 14px 0 rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      position: relative;
      flex-shrink: 0;
    `;
    
    // Hover effects
    button.onmouseover = () => { button.style.transform = 'scale(1.05)'; };
    button.onmouseout = () => { button.style.transform = 'scale(1)'; };
    
    // SVG Icons
    const chatIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>`;
    const closeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    // Inner icon container for animations
    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = `
      transition: transform 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    iconContainer.innerHTML = chatIcon;
    button.appendChild(iconContainer);

    // Toggle open/close logic
    button.onclick = () => {
      isOpen = !isOpen;
      if (isOpen) {
        // OPENING
        container.classList.add('nexuschat-widget-open');
        iframeContainer.style.display = 'block';
        
        // Timeout ensures the display:block has rendered before animating opacity/transform
        setTimeout(() => {
          iframeContainer.style.opacity = '1';
          iframeContainer.style.transform = 'translateY(0) scale(1)';
          iframeContainer.style.pointerEvents = 'auto';
        }, 10);
        
        // Morph icon to close
        iconContainer.style.transform = 'rotate(-90deg) scale(0.5)';
        setTimeout(() => {
          iconContainer.innerHTML = closeIcon;
          iconContainer.style.transform = 'rotate(0deg) scale(1)';
        }, 150);
        
      } else {
        // CLOSING
        container.classList.remove('nexuschat-widget-open');
        iframeContainer.style.opacity = '0';
        iframeContainer.style.transform = 'translateY(20px) scale(0.95)';
        iframeContainer.style.pointerEvents = 'none';
        
        setTimeout(() => {
          iframeContainer.style.display = 'none';
        }, 300);

        // Morph icon to chat
        iconContainer.style.transform = 'rotate(90deg) scale(0.5)';
        setTimeout(() => {
          iconContainer.innerHTML = chatIcon;
          iconContainer.style.transform = 'rotate(0deg) scale(1)';
        }, 150);
      }
    };

    container.appendChild(iframeContainer);
    container.appendChild(button);
    document.body.appendChild(container);
  }

  // Load when the DOM is ready to avoid appending to null bodies
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
