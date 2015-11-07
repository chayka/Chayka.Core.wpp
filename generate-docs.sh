phpdoc -d ./app/,./Plugin.php -t ./docs/php --cache-folder="./docs/php/.cache" --template="xml" --extensions="php"
phpdocmd ./docs/php/structure.xml ./docs/php/
rm -R ./docs/php/.cache ./docs/php/structure.xml