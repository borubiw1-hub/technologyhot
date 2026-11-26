(function() {
    var hash = window.location.hash;
    // আপনার লিংকগুলো #vs= দিয়ে তৈরি হচ্ছে
    if (!hash || !hash.includes('vs=')) {
        alert('No Video Shortener link found in the URL!');
        return;
    }

    var code = hash.split('vs=')[1];
    if(!code) return;

    var BIN_ID = "6b07bf90ab3a7b614481b077"; 
    var ACCESS_KEY = "$2a$10$HuTArk18ADze3MttIsfEyOf1NQ8swvgTbV/h62zD4KyXC595yi7cC"; 

    document.body.innerHTML = "<div style='text-align:center;margin-top:100px;font-family:sans-serif;'><h2>Redirecting... Please wait.</h2></div>";

    fetch('https://api.jsonbin.io/v3/b/' + BIN_ID + '/latest', {
        headers: {
            'X-Access-Key': ACCESS_KEY,
            'X-Bin-Meta': 'false'
        }
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        var link = data.links.find(function(l) { return l.code === code; });
        if (link) {
            var index = data.links.findIndex(function(l) { return l.code === code; });
            data.links[index].clicks = (data.links[index].clicks || 0) + 1;
            
            fetch('https://api.jsonbin.io/v3/b/' + BIN_ID, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Access-Key': ACCESS_KEY
                },
                body: JSON.stringify({ links: data.links })
            }).catch(function(e) { console.log('Click update failed'); });

            window.location.replace(link.target);
        } else {
            document.body.innerHTML = "<div style='text-align:center;margin-top:100px;font-family:sans-serif;'><h2>Error: Link Not Found!</h2></div>";
        }
    })
    .catch(function(err) {
        document.body.innerHTML = "<div style='text-align:center;margin-top:100px;font-family:sans-serif;'><h2>Error loading data!</h2></div>";
    });
})();
