import { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Container, 
  Stack, 
  Typography, 
  Button, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Divider,
  Chip
} from '@mui/material';
import { ledgerService } from '../../services/ledgerService';
import { Category } from '../../domain/financeTypes';

interface CategoriesSectionProps {
  householdId: string;
  categories: Category[];
  onDataUpdated: () => void;
}

export function CategoriesSection({
  householdId,
  categories,
  onDataUpdated
}: CategoriesSectionProps) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;

    await ledgerService.createCategory(householdId, {
      name: newCatName,
      type: newCatType,
      isActive: true
    });

    setNewCatName('');
    onDataUpdated();
  };

  return (
    <Container maxWidth="xs" sx={{ py: 1, px: 2 }}>
      <Stack spacing={3}>
        <Box sx={{ mt: 1 }}>
          <Typography variant="h2" sx={{ fontSize: '24px', fontWeight: 700, color: 'text.primary' }}>
            Categories
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px', mt: 0.5 }}>
            Configure and priorities your income and expense categories
          </Typography>
        </Box>

        {/* Current Categories List */}
        <Box>
          <Typography variant="h3" sx={{ fontSize: '15px', fontWeight: 700, color: 'text.primary', mb: 1.5 }}>
            Income Categories
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {categories.filter(c => c.type === 'income').map(cat => (
              <Chip 
                key={cat.id} 
                label={cat.name} 
                variant="outlined"
                sx={{ borderRadius: '8px', fontWeight: 500 }}
              />
            ))}
          </Box>
        </Box>

        <Box>
          <Typography variant="h3" sx={{ fontSize: '15px', fontWeight: 700, color: 'text.primary', mb: 1.5 }}>
            Expense Categories
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {categories.filter(c => c.type === 'expense').map(cat => (
              <Chip 
                key={cat.id} 
                label={cat.name} 
                variant="outlined"
                sx={{ borderRadius: '8px', fontWeight: 500 }}
              />
            ))}
          </Box>
        </Box>

        <Divider />

        {/* Create Category Card */}
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700, color: 'text.primary', mb: 2 }}>
              Add New Category
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Category Name"
                placeholder="e.g. Subscriptions"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <FormControl fullWidth size="small">
                <InputLabel id="cat-type-label">Type</InputLabel>
                <Select
                  labelId="cat-type-label"
                  value={newCatType}
                  label="Type"
                  onChange={e => setNewCatType(e.target.value as 'income' | 'expense')}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                </Select>
              </FormControl>
              <Button
                fullWidth
                variant="contained"
                onClick={handleCreateCategory}
                sx={{
                  py: 1.2,
                  borderRadius: '12px',
                  boxShadow: 'none',
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                Create Category
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
