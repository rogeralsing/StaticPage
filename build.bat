rm -rf wiki
rm -rf site
rm -rf output

npm -d install
git clone https://github.com/akkadotnet/akka.net.wiki ../tmp/wiki
git clone https://github.com/akkadotnet/template.akkadotnet.github.com ../tmp/site
git clone https://rogeralsing:alexander02@github.com/akkadotnet/akkadotnet.github.com ../tmp/output

rm -rf ../tmp/site/wiki
mkdir ../tmp/site/wiki

rm -rf ../tmp/output/wiki
mkdir ../tmp/output/wiki

node generate.js
cd ../tmp/output
git add -A
git diff-index --quiet HEAD || git commit -m 'bla'
git pull
git push origin master