"use strict";

function lambda(body)
{
	return { type: "lam", body: body };
}

function apply(f, x)
{
	return { type: "app", f: f, x: x };
}

function variable(n)
{
	return { type: "var", n: n };
}

const I = lambda(variable(0));
const True = lambda(lambda(variable(1)));
const False = lambda(lambda(variable(0)));
const Nil = False;
const Not = lambda(lambda(lambda(apply(apply(variable(2), variable(0)), variable(1)))));

function toString(expr)
{
	return toString_(expr, 0).replace(/\.λ/g, " ");

	function toString_(expr, n)
	{
		switch (expr.type)
		{
			case "lam":
			{
				return `λ${String.fromCharCode(97 + n)}.${toString_(expr.body, n + 1)}`;
			}
			case "app":
			{
				let left = toString_(expr.f, n);
				let right = toString_(expr.x, n);
				if (expr.f.type === "lam")
				{
					left = `(${left})`;
				}
				if (expr.x.type !== "var")
				{
					right = `(${right})`;
				}
				return `${left} ${right}`;
			}
			case "var":
			{
				return `${String.fromCharCode(96 + n - expr.n)}`;
			}
		}
	}
}

function beta(f, x)
{
	switch (f.type)
	{
		case "lam":
		{
			return beta_(f.body, x, 0);
		}
		case "app":
		{
			return beta(beta(f.f, f.x), x);
		}
		case "var":
		{
			return apply(f, x);
		}
	}

	function beta_(f, x, n)
	{
		switch (f.type)
		{
			case "lam":
			{
				return lambda(beta_(f.body, renumberVars(x, 0), n+1));
			}
			case "app":
			{
				return apply(beta_(f.f, x, n), beta_(f.x, x, n));
			}
			case "var":
			{
				if (f.n === n)
				{
					return x;
				}
				else if (f.n > n)
				{
					return variable(f.n-1);
				}
				else
				{
					return f;
				}
			}
		}

		function renumberVars(expr, n)
		{
			switch (expr.type)
			{
				case "lam":
				{
					return lambda(renumberVars(expr.body, n+1));
				}
				case "app":
				{
					return apply(renumberVars(expr.f, n), renumberVars(expr.x, n));
				}
				case "var":
				{
					if (expr.n >= n)
					{
						return variable(expr.n+1);
					}
					else
					{
						return expr;
					}
				}
			}
		}
	}
}

function toLambda(expr)
{
	while (expr.type === "app")
	{
		expr = beta(expr.f, expr.x);
	}
	return expr;
}

function toNormal(expr)
{
	switch (expr.type)
	{
		case "lam":
		{
			return lambda(toNormal(expr.body));
		}
		case "app":
		{
			switch (expr.f.type)
			{
				case "lam":
				{
					return toNormal(beta(expr.f, expr.x));
				}
				case "app":
				{
					const f = toNormal(expr.f);
					switch (f.type)
					{
						case "lam":
						{
							return toNormal(apply(f, expr.x));
						}
						case "app":
						case "var":
						{
							return apply(f, toNormal(expr.x));
						}
					}
				}
				case "var":
				{
					return apply(expr.f, toNormal(expr.x));
				}
			}
		}
		case "var":
		{
			return expr;
		}
	}
}

class Scanner
{
	constructor(str)
	{
		this.str = str;
		this.i = 0;
	}

	next()
	{
		return this.str[this.i++];
	}

	get eof()
	{
		return this.i >= this.str.length;
	}
}

function fromBinary(scanner)
{
	if (scanner.next() === "0")
	{
		if (scanner.next() === "0")
		{
			return lambda(fromBinary(scanner));
		}
		else
		{
			return apply(fromBinary(scanner), fromBinary(scanner));
		}
	}
	else
	{
		let x = 0;
		while (scanner.next() === "1")
		{
			x++;
		}
		return variable(x);
	}
}

function toBinary(expr)
{
	switch (expr.type)
	{
		case "lam":
		{
			return "00" + toBinary(expr.body);
		}
		case "app":
		{
			return "01" + toBinary(expr.f) + toBinary(expr.x);
		}
		case "var":
		{
			return "1".repeat(expr.n + 1) + "0";
		}
	}
}

function fromBinaryList(scanner)
{
	if (scanner.eof)
	{
		return Nil;
	}
	else
	{
		return cons(scanner.next() == "0" ? True : False, fromBinaryList(scanner));
	}

	function cons(h, t)
	{
		return lambda(apply(apply(variable(0), h), t));
	}
}

function equal(a, b)
{
	if (a.type !== b.type)
	{
		return false;
	}
	switch (a.type)
	{
		case "lam":
		{
			return equal(a.body, b.body);
		}
		case "app":
		{
			return equal(a.f, b.f) && equal(a.x, b.x);
		}
		case "var":
		{
			return a.n === b.n;
		}
	}
}

function toBoolean(expr)
{
	if (equal(expr, True))
	{
		return true;
	}
	else if (equal(expr, False))
	{
		return false;
	}
	else
	{
		throw new Error("Non-boolean value.");
	}
}

function evalBlc(str, maxOutput)
{
	if (maxOutput === undefined)
	{
		maxOutput = Infinity;
	}
	const scanner = new Scanner(str.replace(/[^01]/g, ""));
	let program = fromBinary(scanner);
	program = toLambda(apply(program, fromBinaryList(scanner)));
	let output = "";
	for (let i = 0; i < maxOutput; i++)
	{
		output += toBoolean(toNormal(apply(program, True))) ? "0" : "1";
		program = toLambda(apply(program, False));
		if (equal(program, Nil))
		{
			break;
		}
	}
	return output;
}
