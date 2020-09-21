const state    = require('./state.js')
const google   = require('googleapis').google
const googleSearchCredentials = require ('../credentials/google-search-engine-images.json')
const customSearch = google.customsearch('v1');
const imageDownloader    = require('image-downloader')



async function robot(){
  const content = state.load()

 await fecthImagesAllSentences(content)
 await downloadAllIMagens(content)

      

  
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
}
 
  //console.log(response.data.items, {deph : null})
  //process.exit(0)


module.exports = robot