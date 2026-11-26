(async function() {
    // 🚨 তোমার JSONBin Details
    const BIN_ID = "6b07bf90ab3a7b614481b077"; 
    const ACCESS_KEY = "$2a$10$HuTArk18ADze3MttIsfEyOf1NQ8swvgTbV/h62zD4KyXC595yi7cC"; 

    const hash = window.location.hash;
    let shortCode = null;
    if (hash && (hash.includes('vs=') || hash.includes('share='))) {
        shortCode = hash.split('=')[1];
    }

    if (!shortCode) return alert('❌ URL-এ কোনো শর্ট লিংক কোড পাওয়া যায়নি!');

    // 🌟 UI তৈরি
    const ui = document.createElement('div');
    ui.style.cssText = 'position:fixed; top:20px; right:20px; background:#ffffff; color:#333; padding:20px; border-radius:12px; z-index:999999; border:1px solid #e2e8f0; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); font-family:sans-serif; width:350px;';
    ui.innerHTML = `
        <h3 style="margin:0 0 10px 0; color:#2563eb; font-size:16px; font-weight:bold;">Pinurl ➔ share.google</h3>
        <button id="startBtn" style="background:#2563eb; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">Start</button>
        <span id="statusText" style="font-size:12px; color:#64748b; margin-left:10px;">Ready</span>
        <div style="margin-top:15px; width:100%; background:#e2e8f0; height:8px; border-radius:4px; overflow:hidden;">
            <div id="progressBar" style="width:0%; height:100%; background:#22c55e; transition:width 0.3s;"></div>
        </div>
        <div id="resultBox" style="margin-top:15px; display:none;">
            <input type="text" id="shareLinkInput" readonly style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px; font-size:12px; background:#f8fafc; box-sizing:border-box;">
            <button id="copyBtn" style="margin-top:10px; background:#22c55e; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer; width:100%;">Copied ✓</button>
        </div>
    `;
    document.body.appendChild(ui);

    const startBtn = document.getElementById('startBtn');
    const statusText = document.getElementById('statusText');
    const progressBar = document.getElementById('progressBar');
    const resultBox = document.getElementById('resultBox');
    const shareLinkInput = document.getElementById('shareLinkInput');

    startBtn.onclick = async function() {
        startBtn.disabled = true;
        startBtn.innerText = "Processing...";
        progressBar.style.width = '10%';
        statusText.innerText = "Fetching URL...";

        try {
            const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
                headers: { 'X-Access-Key': ACCESS_KEY, 'X-Bin-Meta': 'false' }
            });
            const data = await res.json();
            const link = data.links.find(l => l.code === shortCode);

            if (!link) throw new Error("Link not found in database!");
            if (!link.target.includes('youtube.com') && !link.target.includes('youtu.be')) {
                alert("⚠️ share.google লিংক সাধারণত শুধুমাত্র ইউটিউব ভিডিওর জন্য কাজ করে। অন্য লিংক দিলে শেয়ার বাটন নাও আসতে পারে।");
            }

            progressBar.style.width = '30%';
            statusText.innerText = "Opening Google...";

            const popup = window.open('https://www.google.com/search?q=' + encodeURIComponent(link.target), 'GoogleShareGen', 'width=800,height=600');
            if (!popup) throw new Error("Popup blocked! Please allow popups.");

            let attempts = 0;
            const maxAttempts = 30; // ৩০ বার চেষ্টা করবে (প্রায় ১৫ সেকেন্ড)
            let shareBtnClicked = false;
            
            const checkInterval = setInterval(() => {
                attempts++;
                progressBar.style.width = `${30 + (attempts * 2)}%`; // প্রোগ্রেস বার বাড়বে
                statusText.innerText = `Searching... (${attempts}/${maxAttempts})`;
                
                try {
                    const doc = popup.document;
                    if (!doc) return; // পপআপ এখনো রেডি নয়

                    // 🌟 ১. পেজের ভেতরে share.google লিংক খোঁজা (Regex দিয়ে)
                    let match = doc.body.innerText.match(/https:\/\/share\.google\/[a-zA-Z0-9_-]+/);
                    if (match) {
                        clearInterval(checkInterval);
                        const shareLink = match[0];
                        finishProcess(shareLink, popup);
                        return;
                    }

                    // 🌟 ২. যদি লিংক না পাওয়া যায়, তবে Share বাটন খুঁজে ক্লিক করা
                    if (!shareBtnClicked) {
                        let moreBtn = doc.querySelector('div[aria-label="More options"]') || 
                                      doc.querySelector('div[aria-label="More"]') ||
                                      Array.from(doc.querySelectorAll('div[role="button"]')).find(el => el.getAttribute('aria-label')?.includes('More'));

                        let shareBtn = doc.querySelector('div[aria-label="Share"]') || 
                                       Array.from(doc.querySelectorAll('div[role="button"]')).find(el => el.innerText.includes('Share'));

                        if (shareBtn) {
                            shareBtn.click();
                            shareBtnClicked = true;
                        } else if (moreBtn) {
                            moreBtn.click();
                            shareBtnClicked = true; 
                            setTimeout(() => {
                                let menuShare = Array.from(doc.querySelectorAll('div[role="menuitem"], div[role="button"]')).find(el => el.innerText.includes('Share') || el.innerText.includes('শেয়ার'));
                                if (menuShare) menuShare.click();
                            }, 500);
                        }
                    }

                } catch (err) {
                    // ক্রস-অরিজিন এরর হলে ইগনোর করব, পপআপ লোড হতে সময় দিব
                }

                if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    statusText.innerText = "❌ Timeout! Share link not found.";
                    startBtn.innerText = "Retry";
                    startBtn.disabled = false;
                    progressBar.style.background = '#ef4444';
                }
            }, 500); // প্রতি ০.৫ সেকেন্ড পর পর চেক করবে

            function finishProcess(shareLink, popupWindow) {
                progressBar.style.width = '100%';
                progressBar.style.background = '#22c55e';
                statusText.innerText = "Done: 1/1";
                startBtn.style.display = 'none';
                resultBox.style.display = 'block';
                shareLinkInput.value = shareLink;
                navigator.clipboard.writeText(shareLink);

                document.getElementById('copyBtn').onclick = () => {
                    navigator.clipboard.writeText(shareLink);
                    document.getElementById('copyBtn').innerText = "Copied ✓";
                };

                setTimeout(() => popupWindow.close(), 1500);
            }

        } catch (err) {
            statusText.innerText = "❌ " + err.message;
            startBtn.innerText = "Retry";
            startBtn.disabled = false;
            progressBar.style.background = '#ef4444';
        }
    };
})();
