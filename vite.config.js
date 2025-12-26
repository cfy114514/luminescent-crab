import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'configure-server',
        configureServer(server) {
          server.middlewares.use('/api/config', async (req, res, next) => {
            if (req.method === 'GET') {
              try {
                const configPath = path.resolve(process.cwd(), 'config.json')
                let userConfig = {}
                if (fs.existsSync(configPath)) {
                  const fileContent = fs.readFileSync(configPath, 'utf-8')
                  userConfig = JSON.parse(fileContent)
                }

                // Return keys from env (careful not to expose everything, only specific ones)
                const apiKeys = {
                  key1: env.VITE_Banana_Key_1 || '',
                  key2: env.VITE_Banana_Key_2 || '',
                  // Fallback to old key if new ones aren't set yet (during migration)
                  legacy: env.VITE_NANOBANANA_API_KEY || ''
                }

                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ userConfig, apiKeys }))
              } catch (e) {
                console.error(e)
                res.statusCode = 500
                res.end(JSON.stringify({ error: 'Failed to read config' }))
              }
            } else if (req.method === 'POST') {
              let body = ''
              req.on('data', chunk => {
                body += chunk.toString()
              })
              req.on('end', () => {
                try {
                  const newConfig = JSON.parse(body)
                  // Write to config.json
                  const configPath = path.resolve(process.cwd(), 'config.json')
                  // Merge with existing or overwrite? Let's overwrite userConfig part.
                  // But wait, the POST body *is* the userConfig.
                  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2))

                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ success: true }))
                } catch (e) {
                  console.error(e)
                  res.statusCode = 500
                  res.end(JSON.stringify({ error: 'Failed to save config' }))
                }
              })
            } else {
              next()
            }
          })
        }
      }
    ],
    server: {
      headers: {
        'x-content-type-options': 'nosniff',
      },
      // Ensure Vite processes the body if needed, but middlewares usually handle raw req
    },
  }
})
