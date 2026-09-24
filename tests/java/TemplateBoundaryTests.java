import java.util.*;
public class TemplateBoundaryTests {
  static void check(boolean value){if(!value)throw new AssertionError();}
  public static void main(String[] args){
    check(Arrays.equals(Template_hash.twoSum(new int[]{2,7,11},9),new int[]{0,1}));
    check(Template_hash.twoSum(new int[]{3},6).length==0);
    check(Template_binary.lowerBound(new int[]{1,3,3,8},3)==1);
    check(Template_binary.lowerBound(new int[]{},3)==0);
    check(Template_window.longest("abba")==2);
    check(Arrays.equals(Template_deque.maximum(new int[]{1,3,2,5},2),new int[]{3,3,5}));
    check(Template_stack.valid("([])"));check(!Template_stack.valid(")("));
    check(Template_answer.speed(new int[]{3,6},3)==3);
    check(Template_greedy.maximum(new int[]{-5,-2,-3})==-2);
    check(Template_knapsack.coins(new int[]{2},3)==-1);
    check(Template_lcs.lcs("ab","ac")==1);
    check(Template_palindrome.count("abba")==6);
    check(Template_power.power(2,-3)==.125);
    check(Template_search.find("abcd","bc")==1);
    check(Template_search.find("","")==0);
    Template_median.Median m=new Template_median.Median();m.add(Integer.MAX_VALUE);m.add(Integer.MAX_VALUE);check(m.value()==Integer.MAX_VALUE);
    Template_fenwick.Fenwick f=new Template_fenwick.Fenwick(3);f.add(0,2);f.add(1,3);f.add(2,1);check(f.range(1,3)==4);
    Template_dsu.DSU d=new Template_dsu.DSU(3);check(d.union(0,1));check(d.union(1,2));check(!d.union(0,2));
    check(Template_dp.stairs(0)==1);check(Template_dp.stairs(4)==5);
    System.out.println("22 Java boundary assertions passed");
  }
}
