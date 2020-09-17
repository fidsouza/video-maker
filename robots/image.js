const state    = require('./state.js')
const google   = require('googleapis').google
const googleSearchCredentials = require ('../credentials/google-search-engine-images.json')
const customSearch = google.customsearch('v1');


async function robot(){
  const content = state.load()

  await fecthImagesAllSentences(content)
  
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
 
  //console.log(response.data.items, {deph : null})
  //process.exit(0)
}

module.exports = robot