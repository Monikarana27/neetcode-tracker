import java.util.*;

public class Template_knapsack {
static int coins(int[] coins,int amount) {
    int[] dp=new int[amount+1];Arrays.fill(dp,amount+1);dp[0]=0;
    for(int total=1;total<=amount;total++) for(int coin:coins) {
        if(coin<=0)throw new IllegalArgumentException();
        if(coin<=total)dp[total]=Math.min(dp[total],dp[total-coin]+1);
    }
    return dp[amount]>amount?-1:dp[amount];
}
}
