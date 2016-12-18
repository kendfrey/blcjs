"use strict";

window.addEventListener("load", function()
{
	document.querySelector("button").addEventListener("click", evaluate);
});

function evaluate()
{
	const input = document.querySelector("#program").value;
	const maxOutput = document.querySelector("#maxoutput").value;
	let output;
	if (maxOutput === "")
	{
		output = evalBlc(input);
	}
	else
	{
		output = evalBlc(input, Number(maxOutput));
	}
	document.querySelector("#output").textContent = output;
}
