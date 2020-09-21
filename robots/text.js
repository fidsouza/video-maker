const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apikey
const watsonNluApiKey   = require('../credentials/watson-nlu.json').apikey
const sentencBoudaryDetection = require('sbd') 
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const state = require('./state.js')

const nlu = new NaturalLanguageUnderstandingV1({
    authenticator: new IamAuthenticator({ apikey: watsonNluApiKey}),
    version: '2018-04-05',
    language: 'pt',
    serviceUrl: 'https://api.us-south.natural-language-understanding.watson.cloud.ibm.com/instances/051ac14c-c08d-4b1e-a981-452b8ba4c76b'
  });

async function robot(){
    const content = state.load()
    
    await fetchContentFromWikepedia(content)
    sanitizeContent(content)
    breakContentintoSentances(content)
    limitMaximumSentences(content)
    await fecthKeyWordsofAllSentences(content)

    state.save(content)

    async function fetchContentFromWikepedia(){
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2?timeout=300')
        const wikipediaResponse  = await wikipediaAlgorithm.pipe({'lang':'pt',
                                                                  'articleName':content.searchTerm})
        const wikipediaContent   = wikipediaResponse.get()

        content.sourceContentOriginal = wikipediaContent.content
        
    }

    function sanitizeContent(content){
        const withoutBlanksLinesAndMarkDown = removeBlankLinesAndMarkDown(content.sourceContentOriginal)
        const withoutDatesInParentstheses = removeDatesInParentes(withoutBlanksLinesAndMarkDown)

        content.sourceContentSanitize = withoutDatesInParentstheses

        function removeBlankLinesAndMarkDown(text){
            const AllLines = text.split('\n')
            const withoutBlanksLinesAndMarkDown = AllLines.filter((line) =>{
                if(line.trim().length === 0 || line.trim().startsWith('=')){
                    return false
                }
                return true
            })
            return withoutBlanksLinesAndMarkDown.join(' ')

        }

        function removeDatesInParentes(text){

            return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')

        }
    }


    function breakContentintoSentances(content) { 
        content.sentences = []
        const sentences = sentencBoudaryDetection.sentences(content.sourceContentSanitize)
        sentences.forEach((sentence) =>{
            content.sentences.push({
                text : sentence,
                keywords :[],
                images: [] 
            })
        })
    }

    function limitMaximumSentences(content){

        content.sentences = content.sentences.slice(0,content.maximumSentences)

    }
    async function fecthKeyWordsofAllSentences(content){
        console.log('> [text-robot] Starting to fetch keywords from Watson')

        for (const sentence of content.sentences){
            console.log(`> [text-robot] Sentence: "${sentence.text}"`)

            sentence.keywords = await fechWatsonAndReturnKeyWords(sentence.text)

            console.log(`> [text-robot] Keywords: ${sentence.keywords.join(', ')}\n`)

        }

    }
    async function fechWatsonAndReturnKeyWords(sentence){
        return new Promise((resolve,reject) => {
            nlu.analyze({
                text: sentence,
                features : {
                    keywords:{}
                }
            },(error , response) =>{
                if(error){
                    reject(error)
                    return
                }
                const keywords = response.result.keywords.map((keyword) => {
                    return keyword.text
                  })
    
                resolve(keywords)
            })
        })
    }
}

module.exports = robot