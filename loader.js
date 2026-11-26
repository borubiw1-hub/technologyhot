(async function() {
    // 🚨 তোমার JSONBin Details
    const BIN_ID = "6b07bf90ab3a7b614481b077"; 
    const ACCESS_KEY = "$2a$10$HuTArk18ADze3MttIsfEyOf1NQ8swvgTbV/h62zD4KyXC595yi7cC"; 

    const hash = window.location.hash;
    let shortCode = null;
    
    if (hash && (hash.includes('vs=') || hash.includes('share='))) {
        shortCode = hash.split('=')[1];
    }

    if (!shortCode) {
        alert('❌ URL-এ কোনো শর্ট লিংক কোড পাওয়া যায়নি!');
        return;
    }

    // UI তৈরি
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:20px; right:20px; background:#0f172a; color:white; padding:20px; border-radius:12px; z-index:999999; border:1px solid #334155; box-shadow:0 10px 30px rgba(0,0,0,0.5); font-family:sans-serif; min-width:300px;';
    overlay.innerHTML = `<h3 style="margin:0 0 10px 0; color:#38bdf8; font-size:16px;">🔗 Generating share.google Link...</h3><p id="statusText" style="margin:0; font-size:13px; color:#94a3b8;">Fetching URL...</p>`;
    document.body.appendChild(overlay);

    const statusText = document.getElementById('statusText');

    try {
        // JSONBin থেকে আসল লিংক আনা
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { 'X-Access-Key': ACCESS_KEY, 'X-Bin-Meta': 'false' }
        });
        const data = await res.json();
        const link = data.links.find(l => l.code === shortCode);

        if (!link) throw new Error("Link not found in database!");

        statusText.innerText = `Searching Google for link...`;

        // গুগলের সার্চ বক্সে লিংকটি বসানো
        const searchBox = document.querySelector('textarea[name="q"], input[name="q"]');
        if (searchBox) {
            searchBox.value = link.target;
            
            // এন্টার কী প্রেস করা
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true });
            searchBox.dispatchEvent(enterEvent);
            
            // গুগল রেজাল্ট লোড হওয়ার অপেক্ষা
            setTimeout(() => {
                statusText.innerText = "Looking for Share button...";
                let shareBtn = document.querySelector('div[aria-label="Share"]') || 
                               document.querySelector('div[data-tooltip="Share"]') ||
                               Array.from(document.querySelectorAll('div[role="button"]')).find(el => el.innerText.includes('Share'));

                if (shareBtn) {
                    shareBtn.click();
                    setTimeout(() => {
                        let inputField = document.querySelector('input[readonly]') || document.querySelector('textarea');
                        if (inputField && inputField.value.includes('share.google')) {
                            const shareLink = inputField.value;
                            navigator.clipboard.writeText(shareLink);
                            
                            statusText.innerText = "✅ Success! Link copied.";
                            overlay.innerHTML += `
                                <div style="margin-top:15px; padding:10px; background:#1e293b; border-radius:6px; font-size:12px; word-break:break-all; border:1px solid #475569;">
                                    <a href="${shareLink}" target="_blank" style="color:#4ade80; text-decoration:none;">${shareLink}</a>
                                </div>
                                <button onclick="this.parentElement.remove()" style="margin-top:10px; background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Close</button>
                            `;
                        } else {
                            throw new Error("Share link not found in popup.");
                        }
                    }, 1500);
                } else {
                    throw new Error("Share button not found. Google UI might have changed.");
                }
            }, 3000); 
        } else {
            throw new Error("Google search box not found!");
        }
    } catch (err) {
        statusText.innerText = "❌ " + err.message;
        setTimeout(() => overlay.remove(), 4000);
    }
})();
