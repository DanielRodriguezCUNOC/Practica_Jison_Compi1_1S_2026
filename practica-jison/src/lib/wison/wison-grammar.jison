/*
* Analizador Lexico
*/

%lex
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







