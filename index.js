const readline = require('readline-sync')
const robots = {
    text:require ('./robots/text.js')
}

async function start() {
    const content = {
        maximumSentences: 8
    }
    content.searchTerm = askAndReturnSearchTerm()
    content.prefix = askAndReturnPrefix()
    
    await robots.text(content)

    function askAndReturnSearchTerm(){
        return readline.question('Digite um termo da Wikipedia')

    }

    function askAndReturnPrefix(){
        const prefixs = ['Quem e ', 'O que é', 'A Historia de']
        const selectedPrefixIndex = readline.keyInSelect(prefixs, 'Escolha uma opção')
        const selectedPrefixText  = prefixs[selectedPrefixIndex]
     
        return(selectedPrefixText)
    }

    console.log(JSON.stringify(content,null,4))

}

start()