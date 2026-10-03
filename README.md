this is plugins that you can use it in istories pro in custome js like this code : 
(function loadSpeakerPlugin() {
```js
    // التحقق من عدم تكرار تحميل السكريبت
    if (document.getElementById('istories-speaker-plugin')) return;

    var script = document.createElement('script');
    script.id = 'istories-speaker-plugin';
    script.type = 'text/javascript';
    script.src = 'https://cdn.jsdelivr.net/gh/ammar7-o/istories-pro-blugins@main/speker.js';
    script.async = true;

    script.onload = function() {
        console.log('تم تحميل سكريبت الناطق بنجاح.');
    };

    script.onerror = function() {
        console.error('فشل في تحميل سكريبت الناطق.');
    };

    document.head.appendChild(script);
})();
```
