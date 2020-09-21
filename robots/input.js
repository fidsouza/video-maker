const readline = require('readline-sync')
const state    = require('./state.js')

function robot (){
    const content = {
        maximumSentences: 7
    }
    content.searchTerm = askAndReturnSearchTerm()
    content.prefix = askAndReturnPrefix()


    state.save(content)

    function askAndReturnSearchTerm(){
        return readline.question('Digite um termo da Wikipedia')

    }

    function askAndReturnPrefix(){
        const prefixs = ['Quem e ', 'O que é', 'A Historia de']
        const selectedPrefixIndex = readline.keyInSelect(prefixs, 'Escolha uma opção')
        const selectedPrefixText  = prefixs[selectedPrefixIndex]
     
        return selectedPrefixText
    }

}

module.exports = robot