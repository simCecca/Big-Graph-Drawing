function dialogueBox(message)
{
    d3.select("#dialogText")
        .attr('font-size', '20')
        .attr('font-weight', 'bold')
        .attr('fill', "gray")
        .text(message);
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}