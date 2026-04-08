/*
* Analizador Lexico
*/

%{
const erroresLexicos = [];
const erroresSintacticos = [];

function registrarErrorLexico(lexema, linea, columna) {
    erroresLexicos.push({
        tipo: 'léxico',
        lexema,
        linea,
        columna,
        mensaje: `Token no reconocido: ${lexema}`
    });
}

function registrarErrorSintactico(mensaje, lexema, linea, columna) {
    erroresSintacticos.push({
        tipo: 'sintáctico',
        lexema,
        linea,
        columna,
        mensaje
    });
}
%}

%lex
%options ranges yylineno
%%

//* ignorar espacios en blanco
\s+                   /* ignorar espacios en blanco */
[\u200B\u200C\u200D\uFEFF\u00A0]+ /* ignorar caracteres invisibles y nbsp */
"#".*                 /* ignorar comentarios de linea */
"/**"[\s\S]*?"*/"     /* ignorar comentarios de bloque */

//* palabras reservadas

"Wison"                 return 'WISON';

"Lex"                   return 'INICIO_LEX';

"Syntax"                return 'INICIO_SYNTAX';

"Terminal"              return 'TERMINAL';
"No_Terminal"           return 'NO_TERMINAL';
"Initial_Sim"           return 'INITIAL_SIM';

//* Simbolos

"_"                    return 'GUION_BAJO';
"?"                     return 'QUESTION_UP';
"¿"                    return 'QUESTION_DOWN';
"{"                     return 'LLAVE_ABIERTA';
":"                     return 'DOS_PUNTOS';
"}"                     return 'LLAVE_CERRADA';
"<"                    return 'MENOR';
"-"                    return 'GUION';
"="                     return 'ASIG_LEX';
";"                    return 'PUNTO_Y_COMA';

//* Identificadores

"$_"[a-zA-Z0-9_]+      return 'ID_TERMINAL';
"%_"[a-zA-Z0-9_]+      return 'ID_NO_TERMINAL';

//* Literales
\'[^\\']*\'             { yytext = yytext.slice(1, -1); return 'CADENA';}
\[a-zA-Z\]             return 'ALFANUMERICO';
\[aA\-zZ\]             return 'ALFANUMERICO';
\[A\-Z\]               return 'ALFANUMERICO';
\[0\-9\]               return 'NUMERO';


//* Operadores

"*"                    return 'ESTRELLA_KLEENE';
"+"                    return 'CERRADURA_POSITIVA';
"|"                    return 'ALTERNACION';
"("                    return 'PARENTESIS_ABIERTO';
")"                    return 'PARENTESIS_CERRADO';

//* Fin de archivo

<<EOF>>                return 'EOF';
.                      {
                          if (yy && typeof yy.registrarErrorLexico === 'function') {
                              yy.registrarErrorLexico(yytext, yylineno + 1, yylloc.first_column + 1);
                          }
                      }

/lex

/*
* Analizador Sintactico
*/ 

//* Produccion inicial o raiz
%start programa_wison

%% //* Inicio de la gramatica

//* Produccion raiz
programa_wison
    : inicio_wison bloque_lex bloque_syntax fin_wison EOF
    { $$ = { lex: $2, syntax: $3, errors: { lexical: erroresLexicos, syntactic: erroresSintacticos } }; return $$; }
    | error fin_wison EOF
    {
        registrarErrorSintactico(
            'La estructura del archivo es inválida.',
            yytext,
            @1.first_line,
            @1.first_column + 1
        );
        $$ = { lex: null, syntax: null, errors: { lexical: erroresLexicos, syntactic: erroresSintacticos } };
    }
    ;

inicio_wison
    : WISON QUESTION_DOWN
    ;

fin_wison
    : QUESTION_UP WISON
    ;

//* Bloque Lexico
bloque_lex
    : inicio_lex lista_declaraciones_lex fin_lex
    { $$ = { terminals: $2 }; }
    | error fin_lex
    {
        registrarErrorSintactico(
            'El bloque léxico está incompleto o mal formado.',
            yytext,
            @1.first_line,
            @1.first_column + 1
        );
        $$ = { terminals: [] };
    }
    ;

inicio_lex
    : INICIO_LEX LLAVE_ABIERTA DOS_PUNTOS
    ;

fin_lex
    : DOS_PUNTOS LLAVE_CERRADA
    ;

//* lista de declaraciones lexicas
lista_declaraciones_lex
    : lista_declaraciones_lex declaracion_terminal
    { $$ = $1.concat([$2]); }
    | declaracion_terminal
    { $$ = [$1]; }
    ;

//* Declaracion de terminales
declaracion_terminal
    : TERMINAL ID_TERMINAL asig_lex expresion_lexica PUNTO_Y_COMA
    { $$ = { kind: 'terminal', id: $2, expr: $4 }; }
    | error PUNTO_Y_COMA
    {
        registrarErrorSintactico(
            'Declaración de terminal incompleta o mal formada.',
            yytext,
            @1.first_line,
            @1.first_column + 1
        );
        $$ = { kind: 'terminal', id: null, expr: [] };
    }
    ;

asig_lex
    : MENOR GUION
    ;

//* Expresiones Lexicas
expresion_lexica
    : lista_elementos_lexicos
    { $$ = $1; }
    ;

lista_elementos_lexicos
    : lista_elementos_lexicos elemento_lexico
    { $$ = $1.concat([$2]); }
    | elemento_lexico
    { $$ = [$1]; }
    ;

elemento_lexico
    : unidad_lexica operador_unario
    { $$ = { type: 'unario', value: $1, operator: $2 }; }
    | unidad_lexica
    { $$ = $1; }
    ;

operador_unario
    : ESTRELLA_KLEENE
    { $$ = '*'; }
    | CERRADURA_POSITIVA
    { $$ = '+'; }
    | QUESTION_UP
    { $$ = '?'; }
    ;

unidad_lexica
    : CADENA
    { $$ = { type: 'literal', value: $1 }; }
    | ALFANUMERICO
    { $$ = { type: 'alfanumerico', value: $1 }; }
    | NUMERO
    { $$ = { type: 'numero', value: $1 }; }
    | ID_TERMINAL
    { $$ = { type: 'terminal_ref', value: $1 }; }
    | PARENTESIS_ABIERTO lista_elementos_lexicos PARENTESIS_CERRADO
    { $$ = $2; }
    ;

//* Bloque Sintactico
bloque_syntax
    : inicio_syntax lista_no_terminales declaracion_inicial lista_producciones fin_syntax
    { $$ = { nonTerminals: $2, startSymbol: $3, productions: $4 }; }
    | error fin_syntax
    {
        registrarErrorSintactico(
            'El bloque sintáctico está incompleto o mal formado.',
            yytext,
            @1.first_line,
            @1.first_column + 1
        );
        $$ = { nonTerminals: [], startSymbol: null, productions: [] };
    }
    ;

inicio_syntax
    : INICIO_SYNTAX LLAVE_ABIERTA LLAVE_ABIERTA DOS_PUNTOS
    ;

fin_syntax
    : DOS_PUNTOS LLAVE_CERRADA LLAVE_CERRADA
    ;

//* Declaracion de no terminales
lista_no_terminales
    : lista_no_terminales declaracion_no_terminal
    { $$ = $1.concat([$2]); }
    | declaracion_no_terminal
    { $$ = [$1]; }
    ;

declaracion_no_terminal
    : NO_TERMINAL ID_NO_TERMINAL PUNTO_Y_COMA
    { $$ = $2; }
    | error PUNTO_Y_COMA
    {
        registrarErrorSintactico(
            'Declaración de no terminal incompleta o mal formada.',
            yytext,
            @1.first_line,
            @1.first_column + 1
        );
        $$ = null;
    }
    ;

//* Declaracion del simbolo inicial
declaracion_inicial
    : INITIAL_SIM ID_NO_TERMINAL PUNTO_Y_COMA
    { $$ = $2; }
    | INITIAL_SIM error PUNTO_Y_COMA
    {
        registrarErrorSintactico(
            'Declaración del símbolo inicial incompleta o mal formada.',
            yytext,
            @2.first_line,
            @2.first_column + 1
        );
        $$ = null;
    }
    ;

//* Lista de producciones
lista_producciones
    : lista_producciones regla_produccion
    { $$ = $1.concat([$2]); }
        | lista_producciones error PUNTO_Y_COMA
        {
		registrarErrorSintactico(
			'Producción inválida. Omitida hasta encontrar un punto y coma.',
			yytext,
            @2.first_line,
            @2.first_column + 1
		);
		$$ = $1;
        }
    | regla_produccion
    { $$ = [$1]; }
    ;

regla_produccion
    : ID_NO_TERMINAL asig_syn opciones_produccion PUNTO_Y_COMA
    { $$ = { lhs: $1, rhs: $3 }; }
    | ID_NO_TERMINAL asig_syn PUNTO_Y_COMA
    { $$ = { lhs: $1, rhs: [[]] }; }
    | ID_NO_TERMINAL error PUNTO_Y_COMA
    {
        registrarErrorSintactico(
            'Producción incompleta o mal formada.',
            yytext,
            @2.first_line,
            @2.first_column + 1
        );
        $$ = { lhs: $1, rhs: [] };
    }
    ;

asig_syn
    : MENOR ASIG_LEX
    ;

//* Regla de produccion

//* La parte derecha de la produccion puede ser una secuencia de simbolos o varias opciones separadas por el operador de alternacion '|'
opciones_produccion
    : opciones_produccion ALTERNACION secuencia_simbolos 
    { $$ = $1.concat([$3]); }
        | opciones_produccion ALTERNACION error
        {
		registrarErrorSintactico(
			'Una alternativa de la producción está incompleta.',
			yytext,
            @3.first_line,
            @3.first_column + 1
		);
		$$ = $1.concat([[]]);
        }
    | secuencia_simbolos
    { $$ = [$1]; }
    ;

//* Una secuencia de simbolos puede ser una lista de simbolos terminales o no terminales, o puede ser vacia
secuencia_simbolos
    : secuencia_simbolos simbolo 
    { $$ = $1.concat([$2]); }
    | simbolo
    { $$ = [$1]; }
    ;

//* Simbolos basicos

simbolo
    : ID_TERMINAL
    { $$ = { kind: 'idTerminal', value: $1 }; }
    | ID_NO_TERMINAL
    { $$ = { kind: 'idNonTerminal', value: $1 }; }
    ;