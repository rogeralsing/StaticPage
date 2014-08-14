rm -rf ../tmp/wiki
rm -rf ../tmp/site
rm -rf ../tmp/output
npm -d install
git clone https://github.com/akkadotnet/akka.net.wiki ../tmp/wiki
git clone https://github.com/akkadotnet/akkadotnet.github.com ../tmp/site
git clone https://rogeralsing:alexander02@github.com/rogeralsing/rogeralsing.github.io ../tmp/output
node generate.js
cd ../tmp/output
git add -A
git diff-index --quiet HEAD || git commit -m 'bla'
git pull
git push origin master