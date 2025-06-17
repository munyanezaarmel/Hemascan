const CACHE_NAME = "hemascan-v1.0.0"
const STATIC_CACHE_NAME = "hemascan-static-v1.0.0"
const DYNAMIC_CACHE_NAME = "hemascan-dynamic-v1.0.0"

// Files to cache immediately
const STATIC_FILES = [
  "/",
  "/dashboard",
  "/auth/login",
  "/auth/register",
  "/diagnosis/anemia/camera",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/api\.thingspeak\.com/,
  /^https:\/\/cdn\.jsdelivr\.net/,
  /\/api\/thingspeak/,
  /\/api\/ai-recommendations/,
]

// Install event - cache static files
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...")

  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE_NAME)

      try {
        await staticCache.addAll(STATIC_FILES)
        console.log("Service Worker: Static files cached")
      } catch (error) {
        console.error("Service Worker: Failed to cache static files", error)
      }

      // Force activation
      self.skipWaiting()
    })(),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...")

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      const deletePromises = cacheNames
        .filter((name) => name !== STATIC_CACHE_NAME && name !== DYNAMIC_CACHE_NAME)
        .map((name) => caches.delete(name))

      await Promise.all(deletePromises)

      // Take control of all clients
      self.clients.claim()
      console.log("Service Worker: Activated")
    })(),
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") return

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith("http")) return

  event.respondWith(
    (async () => {
      try {
        // Check static cache first
        const staticResponse = await caches.match(request, { cacheName: STATIC_CACHE_NAME })
        if (staticResponse) {
          return staticResponse
        }

        // Check dynamic cache
        const dynamicResponse = await caches.match(request, { cacheName: DYNAMIC_CACHE_NAME })

        // Try network first for API calls
        if (isApiRequest(request.url)) {
          try {
            const networkResponse = await fetch(request)

            if (networkResponse.ok) {
              // Cache successful API responses
              const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME)
              dynamicCache.put(request, networkResponse.clone())
            }

            return networkResponse
          } catch (error) {
            // Return cached response if network fails
            if (dynamicResponse) {
              return dynamicResponse
            }
            throw error
          }
        }

        // For other requests, try cache first, then network
        if (dynamicResponse) {
          // Fetch in background to update cache
          updateCache(request)
          return dynamicResponse
        }

        // Fetch from network and cache
        const networkResponse = await fetch(request)

        if (networkResponse.ok) {
          const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME)
          dynamicCache.put(request, networkResponse.clone())
        }

        return networkResponse
      } catch (error) {
        console.error("Service Worker: Fetch failed", error)

        // Return offline page for navigation requests
        if (request.mode === "navigate") {
          const offlineResponse = await caches.match("/offline")
          if (offlineResponse) {
            return offlineResponse
          }
        }

        // Return a basic offline response
        return new Response(
          JSON.stringify({
            error: "Offline",
            message: "This feature requires an internet connection",
          }),
          {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "application/json" },
          },
        )
      }
    })(),
  )
})

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync", event.tag)

  if (event.tag === "upload-vital-signs") {
    event.waitUntil(uploadPendingVitalSigns())
  }

  if (event.tag === "upload-diagnosis") {
    event.waitUntil(uploadPendingDiagnosis())
  }
})

// Push notifications
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push received", event)

  const options = {
    body: event.data ? event.data.text() : "New health update available",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Dashboard",
        icon: "/icons/dashboard-action.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/close-action.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Hemascan Health Alert", options))
})

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked", event)

  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/dashboard"))
  } else if (event.action === "close") {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow("/"))
  }
})

// Helper functions
function isApiRequest(url) {
  return API_CACHE_PATTERNS.some((pattern) => pattern.test(url))
}

async function updateCache(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME)
      dynamicCache.put(request, response)
    }
  } catch (error) {
    console.log("Service Worker: Background cache update failed", error)
  }
}

async function uploadPendingVitalSigns() {
  // Implement offline vital signs upload
  console.log("Service Worker: Uploading pending vital signs...")
}

async function uploadPendingDiagnosis() {
  // Implement offline diagnosis upload
  console.log("Service Worker: Uploading pending diagnosis...")
}
