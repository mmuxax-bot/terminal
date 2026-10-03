import type { EditorLang } from "@/lib/cm-theme";

export type MoreId =
  | "cpp"
  | "java"
  | "php"
  | "go"
  | "rust"
  | "node"
  | "ts"
  | "ruby"
  | "perl"
  | "lua"
  | "bash"
  | "julia"
  | "r"
  | "haskell";

export type MoreLang = {
  id: MoreId;
  /** Short description for the home card. */
  blurb: string;
  /** Tab label. */
  short: string;
  label: string;
  /** Wandbox compiler id. */
  compiler: string;
  /** File name used for download. */
  file: string;
  editor: EditorLang;
  /** Default compiler/runtime options (one line, space separated). */
  flags: string;
  sample: string;
  stdin?: string;
};

export const MORE_LANGS: MoreLang[] = [
  {
    id: "cpp",
    blurb: "C++20, STL, g++",
    short: "C++",
    label: "C++",
    compiler: "gcc-head",
    file: "main.cpp",
    editor: "cpp",
    flags: "-std=c++20 -Wall -Wextra -O2",
    stdin: "NibrasCode",
    sample: `#include <iostream>
#include <string>
#include <vector>

int main() {
    std::string ad;
    std::cin >> ad;
    std::vector<int> v{1, 2, 3, 4, 5};
    int cem = 0;
    for (int x : v) cem += x;
    std::cout << "Salam, " << ad << "! Cəm = " << cem << "\\n";
    return 0;
}
`,
  },
  {
    id: "java",
    blurb: "OpenJDK 22, Scanner",
    short: "JAVA",
    label: "Java",
    compiler: "openjdk-jdk-22+36",
    file: "Main.java",
    editor: "java",
    flags: "",
    stdin: "NibrasCode",
    sample: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String ad = sc.hasNext() ? sc.next() : "dünya";
        System.out.println("Salam, " + ad + "!");
        int[] a = {3, 1, 2};
        Arrays.sort(a);
        System.out.println(Arrays.toString(a));
    }
}
`,
  },
  {
    id: "php",
    blurb: "PHP 8.3, CLI",
    short: "PHP",
    label: "PHP",
    compiler: "php-8.3.12",
    file: "main.php",
    editor: "php",
    flags: "",
    stdin: "NibrasCode",
    sample: `<?php
$ad = trim(fgets(STDIN) ?: "dünya");
echo "Salam, $ad!\\n";
foreach ([1, 2, 3] as $i) {
    echo $i * $i, "\\n";
}
`,
  },
  {
    id: "go",
    blurb: "Go 1.23, goroutine",
    short: "GO",
    label: "Go",
    compiler: "go-1.23.2",
    file: "main.go",
    editor: "go",
    flags: "",
    stdin: "NibrasCode",
    sample: `package main

import "fmt"

func main() {
	var ad string
	fmt.Scan(&ad)
	fmt.Printf("Salam, %s!\\n", ad)
	for i := 1; i <= 3; i++ {
		fmt.Println(i * i)
	}
}
`,
  },
  {
    id: "rust",
    blurb: "Rust 1.82, təhlükəsiz yaddaş",
    short: "RS",
    label: "Rust",
    compiler: "rust-1.82.0",
    file: "main.rs",
    editor: "rust",
    flags: "",
    stdin: "NibrasCode",
    sample: `use std::io;

fn main() {
    let mut ad = String::new();
    io::stdin().read_line(&mut ad).unwrap();
    println!("Salam, {}!", ad.trim());
    let kvadratlar: Vec<i32> = (1..=3).map(|x| x * x).collect();
    println!("{:?}", kvadratlar);
}
`,
  },
  {
    id: "node",
    blurb: "Node 20, require / fs",
    short: "NODE",
    label: "Node.js",
    compiler: "nodejs-20.17.0",
    file: "main.js",
    editor: "javascript",
    flags: "",
    stdin: "NibrasCode",
    sample: `const ad = require("fs").readFileSync(0, "utf8").trim() || "dünya";
console.log(\`Salam, \${ad}!\`);
console.log([1, 2, 3].map((x) => x * x));
`,
  },
  {
    id: "ts",
    blurb: "TypeScript 5.6",
    short: "TS",
    label: "TypeScript",
    compiler: "typescript-5.6.2",
    file: "main.ts",
    editor: "typescript",
    flags: "",
    sample: `interface Telebe {
  ad: string;
  bal: number;
}

const telebeler: Telebe[] = [
  { ad: "Əli", bal: 91 },
  { ad: "Aysel", bal: 78 },
];
for (const t of telebeler) {
  console.log(\`\${t.ad}: \${t.bal}\`);
}
`,
  },
  {
    id: "ruby",
    blurb: "Ruby 3.4, blok və iterator",
    short: "RB",
    label: "Ruby",
    compiler: "ruby-3.4.9",
    file: "main.rb",
    editor: "ruby",
    flags: "",
    sample: `ad = "NibrasCode"
puts "Salam, #{ad}!"
[1, 2, 3].each { |x| puts x * x }
`,
  },
  {
    id: "perl",
    blurb: "Perl 5.40, regex",
    short: "PL",
    label: "Perl",
    compiler: "perl-5.40.0",
    file: "main.pl",
    editor: "perl",
    flags: "",
    stdin: "NibrasCode",
    sample: `my $ad = <STDIN>;
chomp $ad;
print "Salam, $ad!\\n";
print $_ * $_, "\\n" for 1..3;
`,
  },
  {
    id: "lua",
    blurb: "Lua 5.4, yüngül skript",
    short: "LUA",
    label: "Lua",
    compiler: "lua-5.4.7",
    file: "main.lua",
    editor: "lua",
    flags: "",
    stdin: "NibrasCode",
    sample: `local ad = io.read() or "dünya"
print("Salam, " .. ad .. "!")
for i = 1, 3 do print(i * i) end
`,
  },
  {
    id: "bash",
    blurb: "Shell skriptləri",
    short: "SH",
    label: "Bash",
    compiler: "bash",
    file: "main.sh",
    editor: "shell",
    flags: "",
    stdin: "NibrasCode",
    sample: `read ad
echo "Salam, $ad!"
for i in 1 2 3; do echo $((i * i)); done
`,
  },
  {
    id: "julia",
    blurb: "Julia 1.10, elmi hesab",
    short: "JL",
    label: "Julia",
    compiler: "julia-1.10.5",
    file: "main.jl",
    editor: "julia",
    flags: "",
    stdin: "NibrasCode",
    sample: `ad = readline()
println("Salam, ", ad, "!")
println([x^2 for x in 1:3])
`,
  },
  {
    id: "r",
    blurb: "R 4.4, statistika",
    short: "R",
    label: "R",
    compiler: "r-4.4.1",
    file: "main.R",
    editor: "r",
    flags: "",
    sample: `bal <- c(91, 78, 95)
cat("Orta bal:", mean(bal), "\\n")
print(summary(bal))
`,
  },
  {
    id: "haskell",
    blurb: "GHC 9.10, funksional",
    short: "HS",
    label: "Haskell",
    compiler: "ghc-9.10.1",
    file: "main.hs",
    editor: "haskell",
    flags: "",
    sample: `main :: IO ()
main = do
  putStrLn "Salam, NibrasCode!"
  print (map (^ 2) [1, 2, 3 :: Int])
`,
  },
];

export function findMoreLang(id: string): MoreLang | undefined {
  return MORE_LANGS.find((l) => l.id === id);
}

export function getMoreLang(id: string): MoreLang {
  return findMoreLang(id) ?? MORE_LANGS[0];
}
