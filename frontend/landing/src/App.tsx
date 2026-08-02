import {
  ArrowForwardRounded,
  AutoGraphRounded,
  BoltRounded,
  CheckRounded,
  DarkModeRounded,
  GitHub,
  LightModeRounded,
  SavingsRounded,
  SwapHorizRounded,
  WalletRounded,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  CssBaseline,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  ThemeProvider,
  Toolbar,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { createKippaTheme, type KippaThemeMode } from '@kippa/design-system';

const repositoryUrl = 'https://github.com/mustafabahaa/kippa';

type ThemePreference = KippaThemeMode;

function getInitialMode(): ThemePreference {
  const saved = window.localStorage.getItem('kippa-landing-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function KippaLogo({ mode }: { mode: ThemePreference }) {
  return <Box component="img" src={`${import.meta.env.BASE_URL}assets/${mode === 'dark' ? 'kippa-logo-dark.png' : 'kippa-logo.png'}`} alt="Kippa" sx={{ width: 104, height: 42, objectFit: 'contain', objectPosition: 'left center' }} />;
}

function DashboardPreview() {
  return (
    <Paper className="preview dashboard-preview" aria-label="Kippa dashboard with demo household data">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="body2" color="text.secondary">Nour &amp; Karim</Typography>
          <Typography variant="h6" fontWeight={800}>Good morning</Typography>
        </Box>
        <Box className="demo-avatar">NK</Box>
      </Stack>
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">Available across accounts</Typography>
        <Typography className="balance-number">EGP 48,720</Typography>
        <Typography variant="body2" color="text.secondary">USD 1,340 held separately</Typography>
      </Box>
      <Box className="pace-panel">
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Box>
            <Typography variant="body2" color="text.secondary">Safe to spend today</Typography>
            <Typography variant="h5" fontWeight={800}>EGP 1,165</Typography>
          </Box>
          <Chip label="On track" color="primary" size="small" />
        </Stack>
        <LinearProgress variant="determinate" value={62} sx={{ mt: 2, height: 8, borderRadius: 4 }} />
      </Box>
      <Stack direction="row" spacing={1.5} className="account-row">
        <Box className="account-icon"><WalletRounded /></Box>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={700}>EGP account</Typography>
          <Typography variant="body2" color="text.secondary">Updated just now</Typography>
        </Box>
        <Typography fontWeight={800}>31,460</Typography>
      </Stack>
    </Paper>
  );
}

function FastEntryPreview() {
  return (
    <Paper className="preview entry-preview" aria-label="Kippa fast expense entry with sample data">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={800}>Add expense</Typography>
        <Chip label="Demo" size="small" variant="outlined" />
      </Stack>
      <Box className="amount-field">
        <Typography variant="body2" color="text.secondary">Amount</Typography>
        <Typography variant="h4" fontWeight={800}>EGP 286</Typography>
      </Box>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Chip label="Groceries" color="primary" />
        <Chip label="EGP account" variant="outlined" />
        <Chip label="Today" variant="outlined" />
      </Stack>
      <Button variant="contained" fullWidth startIcon={<CheckRounded />} sx={{ mt: 3 }}>Save expense</Button>
    </Paper>
  );
}

function CyclePreview() {
  return (
    <Paper className="preview cycle-preview" aria-label="Kippa salary cycle using sample budget data">
      <Stack direction="row" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary">Salary cycle</Typography>
          <Typography variant="h6" fontWeight={800}>July 26 to August 25</Typography>
        </Box>
        <SavingsRounded color="primary" />
      </Stack>
      <Divider sx={{ my: 2.5 }} />
      {[
        ['Home', 'EGP 12,800'],
        ['Everyday', 'EGP 8,450'],
        ['Goals', 'EGP 5,200'],
      ].map(([label, value]) => (
        <Stack key={label} direction="row" justifyContent="space-between" sx={{ py: 1 }}>
          <Typography color="text.secondary">{label}</Typography>
          <Typography fontWeight={800}>{value}</Typography>
        </Stack>
      ))}
    </Paper>
  );
}

function Landing({ mode, onToggleMode }: { mode: ThemePreference; onToggleMode: () => void }) {
  const docsUrl = `${import.meta.env.BASE_URL}docs/`;
  const setupUrl = `${docsUrl}getting-started`;

  return (
    <Box className="site-shell">
      <AppBar position="sticky" color="transparent" elevation={0} className="site-header">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Box component="a" href={import.meta.env.BASE_URL} aria-label="Kippa home" sx={{ display: 'flex', mr: 'auto' }}><KippaLogo mode={mode} /></Box>
            <Stack component="nav" direction="row" spacing={3.5} className="desktop-nav">
              <a href="#product">Product</a>
              <a href="#principles">Why Kippa</a>
              <a href={docsUrl}>Docs</a>
              <a href={repositoryUrl}>GitHub</a>
            </Stack>
            <IconButton onClick={onToggleMode} aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`} sx={{ ml: { xs: 1, md: 3 } }}>
              {mode === 'dark' ? <LightModeRounded /> : <DarkModeRounded />}
            </IconButton>
            <Button variant="contained" href={setupUrl} sx={{ ml: 1.5, display: { xs: 'none', sm: 'inline-flex' } }}>Set up Kippa</Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main">
        <Container maxWidth="xl" component="section" className="hero">
          <Box className="hero-copy reveal">
            <Typography className="eyebrow">Household finance that thinks in cycles</Typography>
            <Typography component="h1">Know what is safe today.</Typography>
            <Typography className="hero-lede">One shared view of spending, accounts, and the days until payday.</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} className="hero-actions">
              <Button variant="contained" href={setupUrl} endIcon={<ArrowForwardRounded />}>Set up Kippa</Button>
              <Button variant="outlined" href={repositoryUrl} startIcon={<GitHub />}>View source</Button>
            </Stack>
          </Box>
          <Box className="hero-product reveal reveal-delay">
            <DashboardPreview />
            <FastEntryPreview />
          </Box>
        </Container>

        <Container maxWidth="xl" component="section" className="value-strip" id="principles">
          <Typography variant="h6">Built for the way a household actually moves money.</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} divider={<Divider orientation="vertical" flexItem />}>
            <span><AutoGraphRounded /> Salary-cycle clarity</span>
            <span><SwapHorizRounded /> Honest multi-currency transfers</span>
            <span><WalletRounded /> One shared ledger</span>
          </Stack>
        </Container>

        <Container maxWidth="xl" component="section" className="feature-bento">
          <Box className="bento-heading">
            <Typography component="h2">Built around real household money.</Typography>
            <Typography color="text.secondary">Salary dates move. Currencies mix. Cash drifts. Kippa keeps the ledger honest while daily decisions stay simple.</Typography>
          </Box>
          <Box className="bento-grid">
            <Box className="bento-cell bento-pace">
              <AutoGraphRounded />
              <Box><Typography component="h3">Know your pace</Typography><Typography>See what remains safe until the next salary cycle.</Typography></Box>
            </Box>
            <Box className="bento-cell bento-currency">
              <SwapHorizRounded />
              <Box><Typography component="h3">Multi-currency by design</Typography><Typography>Model USD and EGP movement as transfers, not income.</Typography></Box>
            </Box>
            <Box className="bento-cell bento-ledger">
              <WalletRounded />
              <Box><Typography component="h3">Ledger first</Typography><Typography>Balances and insights come from financial events, never manual patches.</Typography></Box>
            </Box>
            <Box className="bento-cell bento-fast">
              <BoltRounded />
              <Box><Typography component="h3">Fast when life is moving</Typography><Typography>Record the essential details in seconds, from phone or desktop.</Typography></Box>
            </Box>
          </Box>
        </Container>

        <Container maxWidth="xl" component="section" className="product-story">
          <Box className="product-phone">
            <Box component="img" src={`${import.meta.env.BASE_URL}assets/kippa-auth-screen.webp`} alt="Kippa sign-in screen" loading="lazy" />
          </Box>
          <Box className="product-story-copy">
            <Typography component="h2">A real product, not another spreadsheet.</Typography>
            <Typography color="text.secondary">Kippa is an open-source PWA with secure sign-in, offline support, shared households, and Firebase-backed sync.</Typography>
            <Stack spacing={1.5} className="product-checks">
              <span><CheckRounded /> Log expenses from phone or desktop</span>
              <span><CheckRounded /> Budget around your actual salary cycle</span>
              <span><CheckRounded /> Reconcile balances without a bank connection</span>
            </Stack>
            <Button variant="outlined" href={setupUrl} endIcon={<ArrowForwardRounded />}>Set up Kippa</Button>
          </Box>
        </Container>

        <Container maxWidth="xl" component="section" className="showcase" id="product">
          <Box className="showcase-heading">
            <Typography component="h2">Your whole money rhythm, visible.</Typography>
            <Typography color="text.secondary">These product views use a demo household and sample balances. Your personal information never appears on the public site.</Typography>
          </Box>
          <Box className="showcase-grid">
            <Box className="showcase-main"><DashboardPreview /></Box>
            <Stack spacing={2.5} className="showcase-side">
              <FastEntryPreview />
              <CyclePreview />
            </Stack>
          </Box>
        </Container>

        <Container maxWidth="lg" component="section" className="docs-callout">
          <Box>
            <Typography component="h2">The model is documented.</Typography>
            <Typography color="text.secondary">Explore the ledger rules, Firebase architecture, calculations, data model, and product decisions behind Kippa.</Typography>
          </Box>
          <Stack spacing={1.5} alignItems="flex-start">
            <Button variant="contained" color="secondary" href={docsUrl} endIcon={<ArrowForwardRounded />}>Explore docs</Button>
            <Button variant="text" href={repositoryUrl} startIcon={<GitHub />}>Browse source</Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" component="footer">
        <KippaLogo mode={mode} />
        <Typography color="text.secondary">Clear household money decisions, from payday to payday.</Typography>
        <Stack direction="row" spacing={2.5}>
          <a href={docsUrl}>Documentation</a>
          <a href={repositoryUrl}>GitHub</a>
          <a href={setupUrl}>Set up Kippa</a>
        </Stack>
      </Container>
    </Box>
  );
}

export function App() {
  const [mode, setMode] = useState<ThemePreference>(getInitialMode);
  const theme = useMemo(() => createKippaTheme(mode), [mode]);
  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem('kippa-landing-theme', next);
    document.documentElement.dataset.theme = next;
    setMode(next);
  };

  document.documentElement.dataset.theme = mode;

  return <ThemeProvider theme={theme}><CssBaseline /><Landing mode={mode} onToggleMode={toggleMode} /></ThemeProvider>;
}
