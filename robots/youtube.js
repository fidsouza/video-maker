const state = require('./state.js')
const express = require('express')
const google = require('googleapis').google
const youtube = google.youtube({version:'v3'})
const OAuth2 = google.auth.OAuth2
const fs = require('fs')

async function robot(){
    const content = state.load()
    await authenticateWithOAuth()
    const videoInformation = await uploadVideo(content)
    await uploadThumbnail(videoInformation)


    async function authenticateWithOAuth(){
        const webServer = await startWebServer()
        const OAuthClient = await createOAuthCliente()
        requestUserConsent(OAuthClient)
        const authorizationToken = await waitForGoogleCallBack(webServer)
        await requestGoogleForAcessToken(OAuthClient,authorizationToken)
        await setGlobalsGoogleAuthenticator(OAuthClient)
        await stopWebServer(webServer)


        async function startWebServer(){
            return new Promise((resolve,reject)=>{
                const port = 5000
                const app  = express()
                const server = app.listen(port,()=>{
                    console.log(`.> Listning on localhost:${port}`)
                    resolve({
                        app,
                        server
                    })
                })
            }
            )
        }

        async function createOAuthCliente(){
            const credentials = require('../credentials/google-youtube.json')

            const OAuthClient = new OAuth2(
                credentials.web.client_id,
                credentials.web.client_secret   ,
                credentials.web.redirect_uris[0]

            )   
            return OAuthClient
        }

        function requestUserConsent(OAuthClient){
            const consentUrl = OAuthClient.generateAuthUrl({
                acess_type : 'offline',
                scope: ['https://www.googleapis.com/auth/youtube']
            })

            console.log(`- > Por favor me de seu consentimento:${consentUrl}`)
        }

        async function waitForGoogleCallBack(webServer){
            return new Promise((resolve,reject)=>{
                console.log('-> Esperando pelo consentimento do usuário')
                webServer.app.get('/oauth2callback',(req,res)=>{
                    const authCode = req.query.code
                    console.log(`=> Seu Codigo de autorização e:${authCode}`)

                    res.send('<h1>Obrigado</h1><p>Agora você pode fechar esta aba</p>')
                    resolve(authCode)
                })
            })

        }
        async function requestGoogleForAcessToken(OAuthClient,authorizationToken){
            return new Promise((resolve,reject)=>{
                OAuthClient.getToken(authorizationToken,(error,tokens)=>{
                    if(error){
                        return reject(error)
                    }
                    console.log('=> Estes são seus tokens de acesso:')
                    console.log(tokens)
                    OAuthClient.setCredentials(tokens)
                    resolve()
                })
            })
        }
        function setGlobalsGoogleAuthenticator(OAuthClient){
                console.log(`=> OAuthClient is ${OAuthClient}`)
                google.options({
                    auth:OAuthClient
                })
        }

        async function stopWebServer(webServer){
            return new Promise((resolve,reject)=>{
                webServer.server.close(()=>{
                    resolve()
                })
            })
        }
    }


    async function uploadVideo(content){
        const videoPath = './content/video.mp4'
        const videoFileSize = fs.statSync(videoPath).size
        const videoTitle = `${content.prefix} ${content.searchTerm}`
        const videoTags  = [content.searchTerm,...content.sentences[0].keywords]
        const videoDescription  = content.sentences.map((sentence)=>{
            return sentence.text
        }).join('\n\n')

        const requestParameters = {
            part:'snippet,status',
            requestBody:{
                snippet:{
                    title:videoTitle,
                    description:videoDescription,
                    tags : videoTags
                },
                status:{
                    privacyStatus:'unlisted'
                }
            },
            media:{
                body:fs.createReadStream(videoPath)
            }
        }

        const youtubeResponse = await youtube.videos.insert(requestParameters,{
            onUploadProgress : onUploadProgress
        })

        console.log(`=> Seu video estara disponível em : https://youtu.be/${youtubeResponse.data.id}`)
        return youtubeResponse.data

        function onUploadProgress(event){
            const progress = Math.round((event.bytesRead / videoFileSize) * 100)
            console.log(`=> ${progress}% completar`)
        }
    }

    async function uploadThumbnail(videoInformation){
        const videoId = videoInformation.id
        const videoThumbNailFilePath = './content/youtube-thumbnail.png'

        const requestParameters = {
            videoId:videoId,
            media:{
                mimeType : 'image/jpeg',
                body:fs.createReadStream(videoThumbNailFilePath)
            }
        }

        const youtubeResponse = await youtube.thumbnails.set(requestParameters)
        console.log('-> Upload da ThumbNail realizada com sucesso')
    }

}

module.exports = robot