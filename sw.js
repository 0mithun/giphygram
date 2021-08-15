//SW Version
const version = '1.0';


//Static Cache App Shell
const appAssets = [
    'index.html',
    'main.js',
    'images/flame.png',
    'images/logo.png',
    'images/sync.png',
    'vendor/bootstrap.min.css',
    'vendor/jquery.min.js'
];


//Sw install
self.addEventListener('install', e=>{
    e.waitUntil(
        caches.open(`static-${version}`)
            .then(cache => {
                cache.addAll(appAssets)
            })
    )
})


//SW Activate
self.addEventListener('activate', e=>{
    //Clean static cache
    let cleaned = caches.keys().then(keys=>{
        keys.forEach(key=>{
            if(key !==`static-${version}` && key.match(`static-`)){
               return caches.delete(key)
            }
        })
    })
    e.waitUntil(cleaned);
})

//Static cache with network fallback
const staticCache = (req, cacheName = `static-${version}` )=>{
    return caches.match(req).then(res=>{
        //Return cached response if found
        if(res) return res;

        //Fallback to network
        return fetch(req).then(netRes=>{
            //Update cache with new response
            caches.open(cacheName)
                .then(cache=>cache.put(req, netRes))
            
            //Return clone of network response
            return netRes.clone();
        });
    })
}

//Network with cache fallback
const fallbackCache = (req) => {
    return fetch(req)
    .then(netRes=>{
        if(!netRes.ok) throw 'fetch error';

        caches.open(`static-${version}`)
            .then(cache=>cache.put(req, netRes))
        return netRes.clone();
    }).catch(err=>{
        return caches.match(req)
    })
}

//Clean old giphys from the giphy cache
const cleanGiphyCache = (giphys)=>{
    caches.open('giphy')
    .then(cache=>{

        //Get all cache entries
        cache.keys().then(keys=>{
            keys.forEach(key=>{
                if(!giphys.includes(key.url)){
                    cache.delete(key);
                }
            })
        })
    })
}



self.addEventListener('fetch', e=>{
   
    if(e.request.url.match(location.origin)){
        e.respondWith(staticCache(e.request))
    }
    else if(e.request.url.match('https://api.giphy.com/v1/gifs/trending')){
        e.respondWith(fallbackCache(e.request))
    }else if(e.request.url.match('giphy.com/media')){
        e.respondWith(staticCache(e.request, 'giphy'))
    }
})

//Listen for message from client
self.addEventListener('message', e=>{
    if(e.data.action === 'cleanGiphyCache'){
        cleanGiphyCache(e.data.giphys)
    }
})