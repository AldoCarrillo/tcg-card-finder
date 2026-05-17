"use client";

export default function AppHeader() {
  return (
    <header className="app-header">
      <div className="title-with-logo">
        <div>
          <p className="eyebrow">Yu-Gi-Oh! lookup tool</p>
          <h1>TCG Card Finder</h1>
        </div>
        <img
          className="main-logo"
          src="https://toppng.com/uploads/preview/yugioh-logo-yu-gi-oh-11562857421zchdpnt0xu.png"
          alt="Yu-Gi-Oh! logo"
        />
      </div>
    </header>
  );
}
