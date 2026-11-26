(async function() {
    // =====================================================================
    // 🚨 এখানে তোমার JSONBin এর ID এবং Access Key বসাও
    // =====================================================================
    const BIN_ID = "6b07bf90ab3a7b614481b077"; 
    const ACCESS_KEY = "$2a$10$HuTArk18ADze3MttIsfEyOf1NQ8swvgTbV/h62zD4KyXC595yi7cC"; 
    // =====================================================================

    // ১. URL থেকে কোড বের করা
    const hash = window.location.hash;
    let shortCode = null;
    
    // এখানে #vs= অথবা #share= দুটোই চেক করা হচ্ছে
    if (hash && (hash.includes('vs=') || hash.includes('share='))) {
        shortCode = hash.split('=')[1];
    }

    if (!shortCode) {
        alert('❌ URL-এ কোনো শর্ট লিংক কোড পাওয়া যায়নি!');
        return;
    }

    // ২. UI তৈরি করা (ইউজারকে জানানোর জন্য)
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:20px; right:20px; background:#0f172a; color:white; padding:20px; border-radius:12px; z-index:999999; border:1px solid #334155; box-shadow:0 10px 30px rgba(0,0,0,0.5); font-family:sans-serif; min-width:300px;';
    overlay.innerHTML = `
        <h3 style="margin:0 0 10px 0; color:#38bdf8; font-size:16px;">🔗 Generating share.google Link...</h3>
        <p id="statusText" style="margin:0; font-size:13px; color:#94a3b8;">Fetching original URL from database...</p>
    `;
    document.body.appendChild(overlay);

    const statusText = document.getElementById('statusText');

    try {
        // ৩. JSONBin থেকে আসল লিংকটি বের করা
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { 
                'X-Access-Key': ACCESS_KEY,
                'X-Bin-Meta': 'false'
            }
        });
        
        if (!res.ok) throw new Error("Database connection failed!");
        
        const data = await res.json();
        const link = data.links.find(l => l.code === shortCode);

        if (!link) {
            throw new Error("Link not found in database!");
        }

        statusText.innerHTML = `Target found! <br><br><span style="color:#fbbf24; word-break:break-all;">${link.target}</span><br><br>Searching on Google (Please wait)...`;

        // ৪. হিডেন iFrame তৈরি করা গুগলে সার্চ করার জন্য
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = `https://www.google.com/search?q=${encodeURIComponent(link.target)}`;
        document.body.appendChild(iframe);

        // ৫. iFrame লোড হওয়ার পর DOM ম্যানিপুলেশন
        iframe.onload = () => {
            setTimeout(() => {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    
                    // গুগলের শেয়ার বাটন খোঁজার লজিক (বিভিন্ন ক্লাস/অ্যাট্রিবিউট ট্রাই করা হচ্ছে)
                    let shareBtn = doc.querySelector('div[aria-label="Share"]') || 
                                   doc.querySelector('div[data-tooltip="Share"]') ||
                                   Array.from(doc.querySelectorAll('div[role="button"]')).find(el => el.innerText.includes('Share'));

                    if (shareBtn) {
                        statusText.innerText = "Clicking Share button...";
                        shareBtn.click();

                        // পপআপ ওপেন হওয়ার অপেক্ষা
                        setTimeout(() => {
                            // শেয়ার লিংকের ইনপুট বক্স খোঁজা
                            let inputField = doc.querySelector('input[readonly]') || doc.querySelector('textarea');
                            
                            if (inputField && inputField.value.includes('share.google')) {
                                const shareLink = inputField.value;
                                
                                // লিংক কপি করা
                                navigator.clipboard.writeText(shareLink);
                                
                                // UI আপডেট
                                statusText.innerText = "✅ Success! Link copied to clipboard.";
                                overlay.innerHTML += `
                                    <div style="margin-top:15px; padding:10px; background:#1e293b; border-radius:6px; font-size:12px; word-break:break-all; border:1px solid #475569;">
                                        <a href="${shareLink}" target="_blank" style="color:#4ade80; text-decoration:none;">${shareLink}</a>
                                    </div>
                                    <button onclick="this.parentElement.remove()" style="margin-top:10px; background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Close</button>
                                `;
                            } else {
                                throw new Error("Share link not found. Google UI might have changed.");
                            }
                        }, 1500); // পপআপ লোড হতে ১.৫ সেকেন্ড
                    } else {
                        throw new Error("Share button not found. Maybe CAPTCHA or no results.");
                    }
                } catch (err) {
                    statusText.innerText = "❌ " + err.message;
                    setTimeout(() => overlay.remove(), 3000);
                } finally {
                    // কাজ শেষে iFrame মুছে ফেলা
                    setTimeout(() => iframe.remove(), 3000);
                }
            }, 2500); // গুগল রেজাল্ট লোড হতে ২.৫ সেকেন্ড অপেক্ষা
        };

    } catch (err) {
        statusText.innerText = "❌ " + err.message;
        setTimeout(() => overlay.remove(), 3000);
    }
})();
