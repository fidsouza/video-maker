const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apikey
const sentencBoudaryDetection = require('sbd') 

async function robot(content){
    await fetchContentFromWikepedia(content)
    sanitizeContent(content)
    breakContentintoSentances(content)

    async function fetchContentFromWikepedia(){
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2?timeout=300')
        const wikipediaResponse  = await wikipediaAlgorithm.pipe(content.searchTerm)
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
}

module.exports = robot