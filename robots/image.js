const state    = require('./state.js')
const google   = require('googleapis').google
const googleSearchCredentials = require ('../credentials/google-search-engine-images.json')
const customSearch = google.customsearch('v1');
const imageDownloader    = require('image-downloader')
const gm = require('gm').subClass({imageMagick:true})



async function robot(){
  const content = state.load()

 await fecthImagesAllSentences(content)
 await downloadAllIMagens(content)
 await convertAllImages(content)
 await createAllSentencesImages(content)
 await createYoutubeThumbNail()
      

  
  state.save(content)
 
  async function fecthImagesAllSentences(content){
      for (const sentence of content.sentences){
          const query = `${content.searchTerm} ${sentence.keywords[0]}`
          sentence.images = await fetchGoogleAndReturn(query)

          sentence.googleSearchQuery = query 
      }
  }

  async function fetchGoogleAndReturn(query){
        const response = await customSearch.cse.list({
            auth : googleSearchCredentials.apikey,
            cx:googleSearchCredentials.searchEngineId,
            q : query,
            searchType: 'image',
            num : 2 
        })
        const imagesUrl = response.data.items.map((item) =>{
            return item.link
        })

        return imagesUrl
  }

  async function downloadAllIMagens (content){
      content.downloadedImage = []
    
      for(let sentenceIndex = 0; sentenceIndex < content.sentences.length;sentenceIndex++){

         const images = content.sentences[sentenceIndex].images
         for (let imageIndex = 0;imageIndex < images.length;imageIndex ++){
             const imageUrl = images[imageIndex]

             try {
                 if(content.downloadedImage.includes(imageUrl)){
                     throw new Error('Imagem ja foi baixada')
                 }
                 await downloadAndSaveImage(imageUrl,`${sentenceIndex}-original.png` )
                 content.downloadedImage.push(imageUrl)
                 console.log(`>Baixou Imagem com sucesso:${imageUrl}`)
                 break
             } catch (error) {
                 console.log(`>Erro ao baixar a imagem(${imageUrl}):${error}`)
             }
         }
      }
  }

  async function downloadAndSaveImage(url , fileName){
      return imageDownloader.image({
          url,url,
          dest:`./content/${fileName}`
      })
  }

  async function convertAllImages(content){
      for(let sentenceIndex=0; sentenceIndex < content.sentences.length ; sentenceIndex++){
          await convertImage(sentenceIndex)
      }

  }

  async function convertImage(sentenceIndex){
      return new Promise((resolve,reject) =>{
          const inputFile = `./content/${sentenceIndex}-original.png[0]`
          const outputFile = `./content/${sentenceIndex}-converted.png`
          const width = 1920
          const height = 1080
    
          gm()
          .in(inputFile)
          .out('(')
            .out('-clone')
            .out('0')
            .out('-background', 'white')
            .out('-blur', '0x9')
            .out('-resize', `${width}x${height}^`)
          .out(')')
          .out('(')
            .out('-clone')
            .out('0')
            .out('-background', 'white')
            .out('-resize', `${width}x${height}`)
          .out(')')
          .out('-delete', '0')
          .out('-gravity', 'center')
          .out('-compose', 'over')
          .out('-composite')
          .out('-extent', `${width}x${height}`)
          .write(outputFile, (error) => {
            if (error) {
              return reject(error)
            }
  
            console.log(`> [robot-image] Image converted: ${outputFile}`)
            resolve()
          })

      })
  }

  async function createAllSentencesImages(content){

    for (let sentenceIndex = 0; sentenceIndex < content.sentences.length;sentenceIndex ++){
        await createSentenceImage(sentenceIndex,content.sentences[sentenceIndex].text)
    }

  }

  async function createSentenceImage(sentenceIndex,sentenceText){
    return new Promise((resolve, reject) => {
        const outputFile = (`./content/${sentenceIndex}-sentence.png`)
  
        const templateSettings = {
          0: {
            size: '1920x400',
            gravity: 'center'
          },
          1: {
            size: '1920x1080',
            gravity: 'center'
          },
          2: {
            size: '800x1080',
            gravity: 'west'
          },
          3: {
            size: '1920x400',
            gravity: 'center'
          },
          4: {
            size: '1920x1080',
            gravity: 'center'
          },
          5: {
            size: '800x1080',
            gravity: 'west'
          },
          6: {
            size: '1920x400',
            gravity: 'center'
          }
  
        }
  
        gm()
          .out('-size', templateSettings[sentenceIndex].size)
          .out('-gravity', templateSettings[sentenceIndex].gravity)
          .out('-background', 'transparent')
          .out('-fill', 'white')
          .out('-kerning', '-1')
          .out(`caption:${sentenceText}`)
          .write(outputFile, (error) => {
            if (error) {
              return reject(error)
            }
  
            console.log(`> [video-robot] Sentence created: ${outputFile}`)
            resolve()
          })
      })
  }

  async function createYoutubeThumbNail(){
      return new Promise((resolve,reject)=>{
          gm()
            .in('./content/0-converted.png')
            .write('./content/youtube-thumbnail.png',(error)=>{
                if(error){
                    return reject(error)
                }
                console.log('>Criado ThumbNail para Youtube')
            })
      })
  }

  
}
 
  //console.log(response.data.items, {deph : null})
  //process.exit(0)


module.exports = robot