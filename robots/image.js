const state    = require('./state.js')
const google   = require('googleapis').google
const googleSearchCredentials = require ('../credentials/google-search-engine-images.json')
const customSearch = google.customsearch('v1');
const imageDownloader    = require('image-downloader')
const watsonVriApiKey   = require('../credentials/watson-vri.json').apikey
const watsonLanguageApiKey   = require('../credentials/watson-language.json').apikey
const VisualRecognitionV3 = require('ibm-watson/visual-recognition/v3');
const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3');
const { IamAuthenticator } = require('ibm-watson/auth');
const fs = require('fs')
const stringSimilarity = require('string-similarity');



const languageTranslator = new LanguageTranslatorV3({
    authenticator: new IamAuthenticator({ apikey: watsonLanguageApiKey }),
    serviceUrl: 'https://api.us-south.language-translator.watson.cloud.ibm.com/instances/5331da5c-aef0-4127-9336-24e082b5b0e4',
    version: '2018-05-01',
  });

const visualRecognition = new VisualRecognitionV3({
    authenticator: new IamAuthenticator({ apikey: watsonVriApiKey}),
    version: '2018-03-19',
    language: 'pt-br',
    serviceUrl: 'https://api.us-south.visual-recognition.watson.cloud.ibm.com/instances/20ecee41-8f18-4d7a-8fcb-474cdebb9e07'
  });


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
                 const returnDownload =   await downloadAndSaveImage(imageUrl,`${sentenceIndex}-original.png` )
                 content.downloadedImage.push(imageUrl)

                 if(sentenceIndex == 0){
                    const ClassifyImage = await fecthAnalyzeImageWatson(`${sentenceIndex}-original.png`)
                    const sentenceTranslate = await translateSentenceWatson(`${content.searchTerm} ${content.sentences[sentenceIndex].keywords[sentenceIndex]}`)
                    const scoreSimilarity = stringSimilarity.compareTwoStrings(ClassifyImage, sentenceTranslate)
                    
                    if (Math.round(scoreSimilarity * 100) < 60) {
                        throw new Error('Imagem com baixa Similaridade com o tema do video')
                    }
                 }

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
                url:url,
                dest:`./content/${fileName}`
            },(error) =>{
                console.log(`Ops.. Deu erro ao baixar : ${error}`)
            })
} 
  
  async function fecthAnalyzeImageWatson(fileName){
      return new Promise((resolve,reject) =>{

          const params = {
              imagesFile : fs.createReadStream(`./content/${fileName}`)
          }

          visualRecognition.classify(params,function(err,response){
         
            if(err){
                return reject(err)
            }
            const returnAnlyzeWatsonVisualCongnition = JSON.parse(JSON.stringify(response.result)).images[0].classifiers[0].classes
            const classifyImageWatson = returnMaxScoreWatsonRecogntion(returnAnlyzeWatsonVisualCongnition)

            resolve(classifyImageWatson)

          })
          
      })
  }

  async function translateSentenceWatson(sentence) { 
      return new Promise((resolve,reject)=>{
        languageTranslator.translate(
            {
              text: sentence,
              source: 'pt-br',
              target: 'en'
            },(error,response)=>{
                if(error ){
                    reject(error)
                    return
                }
                
               const sentenceTranslating =  response.result.translations[0].translation
               resolve(sentenceTranslating)

            })
      })
  }

   function returnMaxScoreWatsonRecogntion(array){
        const scoreArray = []

        //check max value score
        for(let classIndex = 0 ; classIndex < array.length ; classIndex ++) {     

            scoreArray.push(Math.round(array[classIndex].score * 100))

        }
        const maxscoreArray = scoreArray.sort((a, b) => b - a)[0]

        const maxResultScore   = []

        for (let classIndex = 0 ; classIndex < array.length ; classIndex ++ ){
            const resultScore =Math.round(array[classIndex].score * 100)

            if (maxscoreArray ==  resultScore ){
                maxResultScore.push({class:array[classIndex].class})
            }
        }
        return (maxResultScore[0].class)
   }
}
 
  //console.log(response.data.items, {deph : null})
  //process.exit(0)


module.exports = robot