/* Forge T Labs – shared behaviour: scroll reveal + mobile menu */
(function(){
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  },{threshold:0.01});
  document.querySelectorAll('.reveal').forEach(function(el,i){
    el.style.transitionDelay = (i % 4 * 0.08) + 's';
    io.observe(el);
  });
  var burger = document.getElementById('burger');
  var navUl  = document.querySelector('nav ul');
  if(burger && navUl){
    burger.addEventListener('click', function(){
      var open = navUl.style.display === 'flex';
      navUl.style.cssText = open ? '' :
        'display:flex;position:absolute;top:78px;left:0;right:0;flex-direction:column;' +
        'gap:0;background:var(--bg-2);border-bottom:1px solid var(--line);padding:14px 32px';
    });
  }})();
