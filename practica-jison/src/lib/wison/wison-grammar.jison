/*
* Analizador Lexico
*/

%{
%}

%lex
%options ranges yylineno
%%

//* ignorar espacios en blanco
\s+                   /* ignorar espacios en blanco */
"#".*                 /* ignorar comentarios de linea */
"/**"[\s\S]*?"*/"     /* ignorar comentarios de bloque */

//* palabras reservadas

"Wison ¿"               return 'INICIO_WISON';
"?Wison"                return 'FIN_WISON';

"Lex {:"                return 'INICIO_LEX';
":}"                    return 'FIN_LEX';

"Syntax {{:"            return 'INICIO_SYNTAX';
":}}"                   return 'FIN_SYNTAX';

"Terminal"              return 'TERMINAL';
"No_Terminal"           return 'NO_TERMINAL';
"Initial_Sim"           return 'INITIAL_SIM';


//* Simbolos

"<-"                   return 'ASIG_LEX';
"<="                   return 'ASIG_SYN';
";"                    return 'PUNTO_Y_COMA';

//* Identificadores

"$_"[a-zA-Z0-9_]+      return 'ID_TERMINAL';
"%_"[a-zA-Z0-9_]+      return 'ID_NO_TERMINAL';

//* Literales
\'[^\']*\'             return 'CADENA';
\[aA\-zZ\]             return 'ALFANUMERICO';
\[0\-9\]               return 'NUMERO';


//* Operadores

"*"                    return 'ESTRELLA_KLEENE';
"+"                    return 'CERRADURA_POSITIVA';
"?"                    return 'CLAUSULA'; //* reconoce la cláusula ? para hacer 0 o 1 vez
"|"                    return 'ALTERNACION';
"("                    return 'PARENTESIS_ABIERTO';
")"                    return 'PARENTESIS_CERRADO';

//* Fin de archivo

<<EOF>>                return 'EOF';
.                     return 'INVALIDO'; //* Carecter no reconocido por wison

/lex


/*
* Analizador Sintactico
*/ 

//* Produccion inicial o raiz
%start programa_wison

%% //* Inicio de la gramatica

//* Produccion raiz
programa_wison
    : INICIO_WISON bloque_lex bloque_syntax FIN_WISON EOF
    { $$ = { lex: $2, syntax: $3 }; return $$; }
    ;

//* Bloque Lexico
bloque_lex
    : INICIO_LEX lista_declaraciones_lex FIN_LEX
    { $$ = { terminals: $2 }; }
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
    : TERMINAL ID_TERMINAL ASIG_LEX expresion_lexica PUNTO_Y_COMA
    { $$ = { kind: 'terminal', id: $2, expr: $4 }; }
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
    { $$ = { type: 'unary', value: $1, operator: $2 }; }
    | unidad_lexica
    { $$ = $1; }
    ;

operador_unario
    : ESTRELLA_KLEENE
    { $$ = '*'; }
    | CERRADURA_POSITIVA
    { $$ = '+'; }
    | CLAUSULA
    { $$ = '?'; }
    ;

unidad_lexica
    : CADENA
    { $$ = { type: 'literal', value: $1 }; }
    | ALFANUMERICO
    { $$ = { type: 'class', value: $1 }; }
    | NUMERO
    { $$ = { type: 'class', value: $1 }; }
    | ID_TERMINAL
    { $$ = { type: 'terminal_ref', value: $1 }; }
    | PARENTESIS_ABIERTO lista_elementos_lexicos PARENTESIS_CERRADO
    { $$ = $2; }
    ;

//* Bloque Sintactico
bloque_syntax
    : INICIO_SYNTAX lista_no_terminales declaracion_inicial lista_producciones FIN_SYNTAX
    { $$ = { nonTerminals: $2, startSymbol: $3, productions: $4 }; }
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
    ;

//* Declaracion del simbolo inicial
declaracion_inicial
    : INITIAL_SIM ID_NO_TERMINAL PUNTO_Y_COMA
    { $$ = $2; }
    ;

//* Lista de producciones
lista_producciones
    : lista_producciones regla_produccion
    { $$ = $1.concat([$2]); }
    | regla_produccion
    { $$ = [$1]; }
    ;

regla_produccion
    : ID_NO_TERMINAL ASIG_SYN opciones_produccion PUNTO_Y_COMA
    { $$ = { lhs: $1, rhs: $3 }; }
    ;


//* Regla de produccion

//* La parte derecha de la produccion puede ser una secuencia de simbolos o varias opciones separadas por el operador de alternacion '|'
opciones_produccion
    : opciones_produccion ALTERNACION secuencia_simbolos 
    { $$ = $1.concat([$3]); }
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
    { $$ = { kind: 'T', value: $1 }; }
    | ID_NO_TERMINAL
    { $$ = { kind: 'NT', value: $1 }; }
    ;





