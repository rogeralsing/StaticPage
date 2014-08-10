var git = require('nodegit');

function foo()
{
  git.Repo.clone("https://github.com/akkadotnet/akkadotnet.github.com.git", "c:/tmp", null, function(error, repo) {
    if (error) throw error;
  });
}
